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
        showLocation: true, // New option to show location
        dateFormat: "MMMM D, YYYY", // Format for displaying the date
        locationDateFormat: "[{location} - ]{date}", // Format for combined location and date
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

        if (this.config.showFileName && this.imageInfo.filename) {
            var filenameElem = document.createElement("div");
            filenameElem.className = "image-filename";
            filenameElem.innerHTML = this.imageInfo.filename;
            infoContainer.appendChild(filenameElem);
        }

        // Format location and date if configured
        if ((this.config.showCreationDate && this.imageInfo.creationDate) || 
            (this.config.showLocation && this.imageInfo.location.hasLocation)) {
            
            var dateLocElem = document.createElement("div");
            dateLocElem.className = "image-date-location";
            
            // Format the location string if we have location data
            var locationText = "";
            if (this.config.showLocation && this.imageInfo.location.hasLocation) {
                // Format as City, State - or just City if no state
                if (this.imageInfo.location.city && this.imageInfo.location.state) {
                    locationText = this.imageInfo.location.city + ", " + this.imageInfo.location.state;
                } else if (this.imageInfo.location.city) {
                    locationText = this.imageInfo.location.city;
                } else if (this.imageInfo.location.state) {
                    locationText = this.imageInfo.location.state;
                }
                
                // Add country if available and not already using state
                if (this.imageInfo.location.country && !this.imageInfo.location.state) {
                    locationText += locationText ? ", " + this.imageInfo.location.country : this.imageInfo.location.country;
                }
            }
            
            // Format the date if available
            var dateText = "";
            if (this.config.showCreationDate && this.imageInfo.creationDate) {
                dateText = moment(this.imageInfo.creationDate).format(this.config.dateFormat);
            }
            
            // Combine location and date according to the format
            var displayText = this.config.locationDateFormat
                .replace("{location}", locationText)
                .replace("{date}", dateText);
                
            // Clean up any artifacts if location or date is missing
            displayText = displayText
                .replace(/\[\s*-\s*\]/g, "") // Remove empty brackets with dash
                .replace(/\[\s*\]/g, "")     // Remove empty brackets
                .replace(/\s+-\s+/g, "")     // Remove lone dashes
                .trim();                     // Remove extra whitespace
                
            dateLocElem.innerHTML = displayText;
            infoContainer.appendChild(dateLocElem);
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
