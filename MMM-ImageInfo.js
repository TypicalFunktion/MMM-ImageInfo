/* Magic Mirror
 * Module: MMM-ImageInfo
 * 
 * By TypicalFunktion
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
            creationDate: null
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
            wrapper.innerHTML = "Getting Image Data";
            wrapper.className = "highlight light xsmall";
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
                localPath: "/media/RYFUN/display/backgrounds/" + this.imageInfo.filename
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
            
            // Update with creation date
            if (payload.filename === this.imageInfo.filename) {
                this.imageInfo.creationDate = payload.creationDate;
                this.loaded = true;
                this.updateDom();
            }
        }
    }
});
