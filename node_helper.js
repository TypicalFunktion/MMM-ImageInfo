/* Magic Mirror
 * Node Helper: MMM-ImageInfo
 * 
 * By TypicalFunktion
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for: " + this.name);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "GET_IMAGE_INFO") {
            console.log("MMM-ImageInfo: Getting image info for", payload.filename);
            this.getImageInfo(payload);
        }
    },

    getImageInfo: function(imageData) {
        try {
            let info = {
                filename: imageData.filename,
                creationDate: null
            };

            // Try to access local file
            if (imageData.localPath && fs.existsSync(imageData.localPath)) {
                // First try with exiftool if it's installed (most accurate)
                try {
                    const exifData = execSync(`exiftool -j -DateTimeOriginal -CreateDate -FileCreateDate "${imageData.localPath}"`).toString();
                    const exifJson = JSON.parse(exifData);
                    
                    if (exifJson && exifJson[0]) {
                        // Try to get one of the date fields, in order of preference
                        const dateStr = exifJson[0].DateTimeOriginal || 
                                      exifJson[0].CreateDate || 
                                      exifJson[0].FileCreateDate;
                                      
                        if (dateStr) {
                            // Some EXIF dates are in format "YYYY:MM:DD HH:MM:SS"
                            // Convert to standard format
                            let formattedDate = dateStr;
                            if (dateStr.includes(':') && dateStr.includes(' ')) {
                                formattedDate = dateStr.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
                            }
                            info.creationDate = formattedDate;
                        }
                    }
                } catch (exifError) {
                    console.log("MMM-ImageInfo: exiftool not available or error:", exifError.message);
                    
                    // Fallback to file stats
                    try {
                        const stats = fs.statSync(imageData.localPath);
                        info.creationDate = stats.birthtime || stats.mtime || stats.ctime;
                    } catch (statError) {
                        console.log("MMM-ImageInfo: Error getting file stats:", statError.message);
                    }
                }
            } else {
                console.log("MMM-ImageInfo: Local path not available or file doesn't exist:", imageData.localPath);
                // For remote images or if local path not found, we can't get creation date reliably
            }

            console.log("MMM-ImageInfo: Image info retrieved:", info);
            this.sendSocketNotification("IMAGE_INFO_RESULT", info);
        } catch (error) {
            console.error("MMM-ImageInfo: Error getting image info:", error);
            this.sendSocketNotification("IMAGE_INFO_RESULT", {
                filename: imageData.filename,
                creationDate: null
            });
        }
    }
});
