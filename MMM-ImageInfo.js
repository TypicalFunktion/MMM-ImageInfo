/* Magic Mirror
 * Module: MMM-ImageInfo
 * 
 * By MagicMirror Community
 * MIT Licensed.
 */

Module.register("MMM-ImageInfo", {
    // Default module config
    defaults: {
        updateInterval: 5000, // Update every 5 seconds
        position: "bottom_right",
        headerText: "", // No header by default
        showFileName: true,
        showCreationDate: true,
        showLocation: false, // Disabled location display
        dateFormat: "MMMM D, YYYY", // Format for displaying the date
        textClass: "small", // CSS class for styling the text
        wallpaperSelector: ".MMM-Wallpaper img", // CSS selector for finding the wallpaper image
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
            src: "",
            creationDate: null,
            location: {
                city: null,
                state: null,
                country: null,
                hasLocation: false
            }
        };
        this.loaded = false;
        this.lastCheckedSrc = "";
        
        // Start scanning for image changes
        this.scheduleUpdate();
    },

    // Override DOM generator
    getDom: function() {
        var wrapper = document.createElement("div");
        wrapper.className = "image-info";

        if (!this.loaded) {
            wrapper.innerHTML = "Waiting for image data...";
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

        // Create inline container for filename and date
        var inlineElem = document.createElement("div");
        inlineElem.className = "image-info-inline";

        // Filename on the left
        if (this.config.showFileName && this.imageInfo.filename) {
            var filenameSpan = document.createElement("span");
            filenameSpan.className = "image-filename";
            filenameSpan.innerHTML = this.imageInfo.filename;
            inlineElem.appendChild(filenameSpan);
        }

        // Date on the right
        if (this.config.showCreationDate && this.imageInfo.creationDate) {
            var dateSpan = document.createElement("span");
            dateSpan.className = "image-date";
            dateSpan.innerHTML = moment(this.imageInfo.creationDate).format(this.config.dateFormat);
            inlineElem.appendChild(dateSpan);
        }

        // Only show if at least one part exists
        if (inlineElem.children.length > 0) {
            infoContainer.appendChild(inlineElem);
        }

        wrapper.appendChild(infoContainer);
        return wrapper;
    },

    // Check for image changes
    checkForImageChanges: function() {
        var imageElement = document.querySelector(this.config.wallpaperSelector);
        
        if (!imageElement) {
            Log.info("MMM-ImageInfo: Wallpaper image not found yet");
            return false;
        }
        
        var currentSrc = imageElement.src;
        
        // If the source has changed
        if (currentSrc && currentSrc !== this.lastCheckedSrc) {
            Log.info("MMM-ImageInfo: Image source changed to", currentSrc);
            this.lastCheckedSrc = currentSrc;
            
            // Extract filename from src
            var filename = currentSrc.split('/').pop();
            
            // Clean up any URL parameters
            if (filename.indexOf('?') !== -1) {
                filename = filename.split('?')[0];
            }
            
            // Update our info and request creation date
            this.imageInfo.src = currentSrc;
            this.imageInfo.filename = decodeURIComponent(filename);
            
            // Send to helper to get the file creation date
            this.sendSocketNotification("GET_IMAGE_INFO", {
                src: currentSrc,
                filename: this.imageInfo.filename,
                // Try to get the actual path (will only work for local files)
                localPath: "/home/RYFUN/Pictures/backgrounds/" + this.imageInfo.filename
            });
            
            return true;
        }
        
        return false;
    },

    // Schedule next update
    scheduleUpdate: function() {
        var self = this;
        setInterval(function() {
            self.checkForImageChanges();
        }, this.config.updateInterval);
    },

    // Override socket notification handler
    socketNotificationReceived: function(notification, payload) {
        if (notification === "IMAGE_INFO_RESULT") {
            Log.info("MMM-ImageInfo: Received image info", payload);
            
            // Update with creation date and location
            if (payload.filename === this.imageInfo.filename) {
                this.imageInfo.creationDate = payload.creationDate;
                this.imageInfo.location = payload.location || {
                    city: null,
                    state: null,
                    country: null,
                    hasLocation: false
                };
                this.loaded = true;
                this.updateDom();
            }
        }
    }
});
