/* Magic Mirror
 * Module: MMM-ImageInfo
 * 
 * By TypicalFunktion
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
