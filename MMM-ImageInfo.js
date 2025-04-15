/* Magic Mirror
 * Module: MMM-ImageInfo
 * 
 * By Your Name
 * MIT Licensed.
 */

Module.register("MMM-ImageInfo", {
    // Default module config
    defaults: {
        updateInterval: 10000, // Update every 10 seconds
        position: "bottom_right",
        headerText: "", // No header by default
        showFileName: true,
        showCreationDate: true,
        dateFormat: "MMMM D, YYYY", // Format for displaying the date
        textClass: "small", // CSS class for styling the text
        imagePath: null, // Will be populated by notification from MMM-Wallpaper
    },

    // Define required styles
    getStyles: function() {
        return ["MMM-ImageInfo.css"];
    },

    // Define required scripts
    getScripts: function() {
        return ["moment.js"];
    },

    // Override start method
    start: function() {
        Log.info("Starting module: " + this.name);
        this.imageInfo = {
            path: "",
            filename: "",
            creationDate: null
        };
        this.loaded = false;
        this.scheduleUpdate();
    },

    // Override DOM generator
    getDom: function() {
        var wrapper = document.createElement("div");
        wrapper.className = "image-info";

        if (!this.loaded) {
            wrapper.innerHTML = "Loading...";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        if (this.config.headerText !== "") {
            var header = document.createElement("header");
            header.innerHTML = this.config.headerText;
            wrapper.appendChild(header);
        }

        var infoContainer = document.createElement("div");
        infoContainer.className = this.config.textClass;

        if (this.config.showFileName && this.imageInfo.filename) {
            var filenameElem = document.createElement("div");
            filenameElem.className = "image-filename";
            filenameElem.innerHTML = this.imageInfo.filename;
            infoContainer.appendChild(filenameElem);
        }

        if (this.config.showCreationDate && this.imageInfo.creationDate) {
            var dateElem = document.createElement("div");
            dateElem.className = "image-date";
            var formattedDate = moment(this.imageInfo.creationDate).format(this.config.dateFormat);
            dateElem.innerHTML = formattedDate;
            infoContainer.appendChild(dateElem);
        }

        wrapper.appendChild(infoContainer);
        return wrapper;
    },

    // Schedule next update
    scheduleUpdate: function() {
        var self = this;
        setInterval(function() {
            self.updateDom();
        }, this.config.updateInterval);
    },

    // Override notification handler
    notificationReceived: function(notification, payload, sender) {
        if (notification === "WALLPAPER_CHANGED" && sender && sender.name === "MMM-Wallpaper") {
            Log.info("MMM-ImageInfo: Received wallpaper change notification");
            this.config.imagePath = payload.path;
            this.sendSocketNotification("GET_IMAGE_INFO", { path: payload.path });
        }
    },

    // Override socket notification handler
    socketNotificationReceived: function(notification, payload) {
        if (notification === "IMAGE_INFO_RESULT") {
            Log.info("MMM-ImageInfo: Received image info");
            this.imageInfo = payload;
            this.loaded = true;
            this.updateDom();
        }
    }
});
```

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
```

### MMM-ImageInfo.css

```css
/* MMM-ImageInfo CSS */

.image-info {
    text-align: left;
    padding: 5px 10px;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.4);
    margin-bottom: 10px;
    max-width: 300px;
}

.image-filename {
    font-size: 0.9em;
    margin-bottom: 3px;
}

.image-date {
    font-size: 0.8em;
    opacity: 0.8;
}
