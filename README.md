# MMM-ImageInfo

A MagicMirror² module that displays information about the current background image from the MMM-Wallpaper module, with a focus on showing the original creation date of photographs.

![MMM-ImageInfo Example](https://example.com/mmm-imageinfo-screenshot.jpg)

## Features

- Shows the filename of the current background image
- Displays the original creation date of the image (extracted from EXIF data when available)
- Updates automatically when the wallpaper changes
- Configurable display options (position, formatting, etc.)
- Works seamlessly with MMM-Wallpaper module

## Installation

1. Navigate to your MagicMirror's `modules` directory:
   ```bash
   cd ~/MagicMirror/modules/
   ```

2. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/MMM-ImageInfo.git
   ```

3. Install dependencies:
   ```bash
   # Install ExifTool for better metadata extraction (recommended)
   sudo apt-get update
   sudo apt-get install libimage-exiftool-perl
   ```

4. Add the module to your MagicMirror configuration in `config.js`:
   ```javascript
   {
       module: "MMM-ImageInfo",
       position: "bottom_left", // Can be any valid position
       config: {
           // See configuration options below
       }
   },
   ```

5. Restart your MagicMirror

## Configuration Options

| Option              | Description                                          | Default Value               |
|---------------------|------------------------------------------------------|----------------------------|
| `updateInterval`    | How often to check for image changes (milliseconds)  | `5000` (5 seconds)         |
| `position`          | Where to display the module                          | `'bottom_right'`           |
| `headerText`        | Header text to display above image info              | `''` (no header)           |
| `showFileName`      | Whether to show the image filename                   | `true`                     |
| `showCreationDate`  | Whether to show the image creation date              | `true`                     |
| `dateFormat`        | Format for displaying the date (Moment.js format)    | `'MMMM D, YYYY'`           |
| `textClass`         | CSS class for styling the text                       | `'small'`                  |
| `wallpaperSelector` | CSS selector for finding the wallpaper image         | `'.MMM-Wallpaper img'`     |

### Example Configuration

```javascript
{
    module: "MMM-ImageInfo",
    position: "bottom_left",
    config: {
        updateInterval: 5000,
        showFileName: true,
        showCreationDate: true,
        dateFormat: "MMMM D, YYYY",
        textClass: "small",
        headerText: "Photo Date",
        wallpaperSelector: ".MMM-Wallpaper img",
    }
},
```

## How It Works

MMM-ImageInfo monitors your Magic Mirror DOM for changes to the background image displayed by the MMM-Wallpaper module. When a change is detected:

1. It extracts the filename from the image source
2. Constructs the likely local file path based on your MMM-Wallpaper configuration
3. Uses ExifTool (if available) to extract detailed creation date information from the image's metadata
4. Falls back to basic file system information if ExifTool is not available
5. Displays the information according to your configuration settings

## Customization

You can customize the appearance by modifying the `MMM-ImageInfo.css` file in the module directory.

## Compatibility

- Requires MagicMirror² v2.0.0 or later
- Designed to work with the MMM-Wallpaper module
- Works best with image files that contain EXIF metadata

## Troubleshooting

- **No creation date appears**: Some images may not have creation date metadata. The module will display only the filename in this case.
- **Module shows "Waiting for image data"**: The module might not have detected the wallpaper element yet. Ensure your MMM-Wallpaper module is working correctly.
- **Incorrect dates**: If you see incorrect dates, installing ExifTool (`sudo apt-get install libimage-exiftool-perl`) generally provides more accurate results.

## Dependencies

- [ExifTool](https://exiftool.org/) (optional but recommended for better metadata extraction)
- Moment.js (included with MagicMirror)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
