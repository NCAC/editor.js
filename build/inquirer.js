const inquirer = require("inquirer");

inquirer.registerPrompt("checkboxPlus", require("inquirer-checkbox-plus-prompt"));

module.exports = inquirer;
