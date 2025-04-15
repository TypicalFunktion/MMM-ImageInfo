/**
 * Post-install script to check if ExifTool is installed and provide instructions if not
 */

const { execSync } = require('child_process');
const readline = require('readline');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`\n${colors.bright}${colors.cyan}Checking ExifTool installation...${colors.reset}`);

// Try to execute ExifTool
try {
  const output = execSync('exiftool -ver').toString().trim();
  console.log(`${colors.green}✓ ExifTool is installed! (version ${output})${colors.reset}`);
  console.log(`${colors.green}MMM-ImageInfo will use ExifTool for optimal image metadata extraction.${colors.reset}`);
} catch (error) {
  console.log(`${colors.yellow}⚠ ExifTool is not installed or not in your PATH.${colors.reset}`);
  console.log(`\n${colors.bright}MMM-ImageInfo will still work, but image creation dates may be less accurate.${colors.reset}`);
  console.log(`\n${colors.bright}To install ExifTool for better performance:${colors.reset}`);
  
  // Different instructions based on platform
  if (process.platform === 'linux') {
    console.log(`\n${colors.cyan}For Debian/Ubuntu:${colors.reset}`);
    console.log(`  sudo apt-get update`);
    console.log(`  sudo apt-get install libimage-exiftool-perl`);
    
    console.log(`\n${colors.cyan}For Fedora/RHEL/CentOS:${colors.reset}`);
    console.log(`  sudo dnf install perl-Image-ExifTool`);
  } else if (process.platform === 'darwin') {
    console.log(`\n${colors.cyan}For macOS (using Homebrew):${colors.reset}`);
    console.log(`  brew install exiftool`);
  } else if (process.platform === 'win32') {
    console.log(`\n${colors.cyan}For Windows:${colors.reset}`);
    console.log(`  1. Download the Windows executable from https://exiftool.org/`);
    console.log(`  2. Extract the .exe file and rename it to exiftool.exe`);
    console.log(`  3. Move it to a directory in your PATH or add its location to your PATH`);
  }
  
  console.log(`\n${colors.yellow}You can also visit ${colors.bright}https://exiftool.org/${colors.reset}${colors.yellow} for more information.${colors.reset}`);
}

console.log(`\n${colors.bright}${colors.green}MMM-ImageInfo installation complete!${colors.reset}`);
