const logWithColor = (message, color) => {
    console.log(`\x1b[${color}m${message}\x1b[0m`);
  };
  
  module.exports = logWithColor;