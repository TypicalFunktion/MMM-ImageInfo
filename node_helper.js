### node_helper.js

```javascript
/* Magic Mirror
 * Node Helper: MMM-ImageInfo
 * 
 * By Your Name
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
            console.log("MMM-ImageInfo: Getting image info for", payload.path);
            this.getImageInfo(payload.path);
        }
    },

    getImageInfo: function(imagePath) {
        try {
            // Basic file info
            let filename = path.basename(imagePath);
            let info = {
                path: imagePath,
                filename: filename,
                creationDate: null
            };

            // Try to get the image creation date using exiftool if available
            try {
                // First try with exiftool if it's installed (most accurate)
                const exifData = execSync(`exiftool -j -DateTimeOriginal -CreateDate -FileCreateDate "${imagePath}"`).toString();
                const exifJson = JSON.parse(exifData);
                
                if (exifJson[0]) {
                    // Try to get one of the date fields, in order of preference
                    info.creationDate = exifJson[0].DateTimeOriginal || 
                                      exifJson[0].CreateDate || 
                                      exifJson[0].FileCreateDate;
                }
            } catch (exifError) {
                console.log("MMM-ImageInfo: exiftool not available or error:", exifError.message);
                
                // Fallback to file stats
                const stats = fs.statSync(imagePath);
                info.creationDate = stats.birthtime || stats.mtime || stats.ctime;
            }

            console.log("MMM-ImageInfo: Image info retrieved:", info);
            this.sendSocketNotification("IMAGE_INFO_RESULT", info);
        } catch (error) {
            console.error("MMM-ImageInfo: Error getting image info:", error);
            this.sendSocketNotification("IMAGE_INFO_RESULT", {
                path: imagePath,
                filename: path.basename(imagePath),
                creationDate: null
            });
        }
    }
});
