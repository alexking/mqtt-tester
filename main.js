const mqtt = require("async-mqtt")
const yaml = require("node-yaml")
const inquirer = require("inquirer")
const chalk = require('chalk');

// Load configuration
var config = yaml.readSync("config.yaml")

console.log("Connecting to MQTT...")

// Try to connect to mqtt 
let connection = mqtt.connect(config.mqtt.url, config.mqtt.options)

// Wait until we connect 
connection.on("connect", onConnect)

// Complain if we can't 
connection.on("error", function(e) {
    console.error(e)
})

async function onConnect() {
    try { 

        // Keep track of the last choice to reduce navigation 
        var lastChoice = 0

        // Work inside of a function since we'll want to do this repeatedly 
        async function askThenSend() {

            // Check what message the user wants to send 
            let answer = await inquirer.prompt({
                type: "list",
                name: "message",
                message: "Which message would you like to send?",
                default: lastChoice, 
                choices: function() {

                    // Make a list of function choices 
                    return config.messages.map(function(message, index) {
                        return { 
                            name: message.name,
                            value: index
                        }
                    })
                }
            })

            // Update the last choice 
            lastChoice = answer.message

            // Fetch the message to send 
            let messageToSend = config.messages[answer.message]
            
            // Publish the message on MQTT 
            var data = messageToSend.data

            // If this is an array or object JSONify 
            if (data instanceof Array || data instanceof Object) {
                data = JSON.stringify(data)
            }

            // Log
            console.log()
            console.log(chalk.blue("Topic:") + "   " + messageToSend.topic)
            console.log(chalk.blue("Message:"), data)

            // Publish
            await connection.publish(messageToSend.topic, data)
          
            console.log()
            console.log("Message published 💬")
            console.log()
        }

        // Stay running and asking for messages to send 
        while (true) {
            await askThenSend()
        }

    } catch (e) {
        console.error("Whoops,", e)
        process.exit()
    }
}
