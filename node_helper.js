/* Magic Mirror
 * Node Helper: MMM-ImageInfo
 * 
 * By MagicMirror Community
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const exifParser = require("exif-parser"); // npm dependency

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for: " + this.name);
        this.exiftoolAvailable = false;
        
        // Check if exiftool is available
        try {
            execSync("exiftool -ver");
            this.exiftoolAvailable = true;
            console.log("MMM-ImageInfo: ExifTool is available - using for optimal metadata extraction");
        } catch (e) {
            console.log("MMM-ImageInfo: ExifTool not available - using fallback methods for metadata extraction");
        }
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
                creationDate: null,
                location: {
                    city: null,
                    state: null,
                    country: null,
                    hasLocation: false
                }
            };

            // Try to access local file
            if (imageData.localPath && fs.existsSync(imageData.localPath)) {
                // First try with exiftool if it's installed (most accurate)
                if (this.exiftoolAvailable) {
                    try {
                        // Use a more comprehensive set of tags including GPS and location info
                        const exifData = execSync(`exiftool -j -DateTimeOriginal -CreateDate -FileCreateDate -GPSLatitude -GPSLongitude -City -State -Province -Country -CountryCode -Location -Sub-location "${imageData.localPath}"`).toString();
                        const exifJson = JSON.parse(exifData);
                        
                        if (exifJson && exifJson[0]) {
                            // Extract date information
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
                            
                            // Extract location information
                            const city = exifJson[0].City || exifJson[0].Location || exifJson[0]["Sub-location"];
                            const state = exifJson[0].State || exifJson[0].Province;
                            const country = exifJson[0].Country || exifJson[0].CountryCode;
                            
                            if (city) info.location.city = city;
                            if (state) info.location.state = state;
                            if (country) info.location.country = country;
                            
                            // Check if we have GPS coordinates but no location
                            if ((!city && !state) && (exifJson[0].GPSLatitude && exifJson[0].GPSLongitude)) {
                                // We have coordinates but no location names
                                // In a full implementation, you could add reverse geocoding here
                                // For simplicity, we'll just set a flag
                                info.location.hasCoordinates = true;
                            }
                            
                            // Set location flag if we have any location data
                            info.location.hasLocation = !!(city || state || country);
                        }
                    } catch (exifError) {
                        console.log("MMM-ImageInfo: Error using ExifTool:", exifError.message);
                    }
                }
                
                // If no date from exiftool, try with exif-parser
                if (!info.creationDate) {
                    try {
                        const buffer = fs.readFileSync(imageData.localPath);
                        const parser = exifParser.create(buffer);
                        const result = parser.parse();
                        
                        if (result && result.tags) {
                            // Get date information
                            if (result.tags.DateTimeOriginal) {
                                info.creationDate = new Date(result.tags.DateTimeOriginal * 1000).toISOString();
                            } else if (result.tags.CreateDate) {
                                info.creationDate = new Date(result.tags.CreateDate * 1000).toISOString();
                            }
                            
                            // Note: exif-parser has limited support for location data
                            // More advanced parsing would be needed for GPS coordinates
                        }
                    } catch (parserError) {
                        console.log("MMM-ImageInfo: Error using exif-parser:", parserError.message);
                    }
                }
                
                // Fallback to file stats if still no date
                if (!info.creationDate) {
                    try {
                        const stats = fs.statSync(imageData.localPath);
                        info.creationDate = stats.birthtime || stats.mtime || stats.ctime;
                    } catch (statError) {
                        console.log("MMM-ImageInfo: Error getting file stats:", statError.message);
                    }
                }
            } else {
                console.log("MMM-ImageInfo: Local path not available or file doesn't exist:", imageData.localPath);
                // For remote images or if local path not found, we can't get metadata reliably
            }

            console.log("MMM-ImageInfo: Image info retrieved:", info);
            this.sendSocketNotification("IMAGE_INFO_RESULT", info);
        } catch (error) {
            console.error("MMM-ImageInfo: Error getting image info:", error);
            this.sendSocketNotification("IMAGE_INFO_RESULT", {
                filename: imageData.filename,
                creationDate: null,
                location: {
                    city: null,
                    state: null,
                    country: null,
                    hasLocation: false
                }
            });
        }
    }
});
