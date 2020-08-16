//				.on('set', function(value, callback, context)); function called when a change originates from the iOS Home Application.  This should process the value receive from iOS to then send a new value to Hubitat. 
// 				.on('change', function(data)) - Similar to .on('set' ...) - 'change' will trigger when the HomeKit Object's value was changed from the iOS application as well as when an updateValue was called.
//				.on('HSvalueChanged', function(newHSValue, HomeKitObject) - use this to process a change originating from Hubitat. The value of HomeKitObject is either a HomeKit Service or a HomeKit Characteristic. This HomeKit Object is identified by the call .updateUsingHSReference(that.config.ref) which registers the object to receive a change originating from Hubitat

'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
var HubData = [];
 
console.log(cyan("Loading HomeKitDeviceSetup.js"));

exports.setupServices = function (that, services)
{
console.log(cyan("that is: " + Object.getOwnPropertyNames(that.api)));


	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;
	// console.log(chalk.cyan(`HubData is: ${Object.getOwnPropertyNames(that.HubData)}`));
	HubData = that.HubData;
	
	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
		.setCharacteristic(Characteristic.Model, that.model)
		.setCharacteristic(Characteristic.SerialNumber, "HS " + that.config.type + " ref " + that.ref);
	services.push(informationService);	
	
	console.log(chalk.yellow(`Setting up a device of type: ${that.type}`));

	switch (that.type) 
	{
		case "Generic Z-Wave CentralScene Dimmer": 
		case "Generic Zigbee Bulb":
		{

			var thisService = new Service.Lightbulb()
			thisService.isPrimaryService = true;			
			
			var Switch	= thisService.getCharacteristic(Characteristic.On);
			Switch.id = that.config.id;
			that.HubData.registerObjectToReceiveUpdates(Switch.id, Switch);
			


			Switch
				.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					// console.log(chalk.yellow(`Received HubReport \n ${Object.getOwnPropertyNames(HubReport)} with name ${HubReport.name} and value ${HubReport.value}`));

					if (HubReport.name != "switch") return;
					// console.log(chalk.green(`Value is: ${HubReport.value}`));

					switch(HubReport.value)
					{
						case "off":  // assumes 0 is always off; any other value is On.
							{
								Switch.updateValue(0); 
								break ;
							}
						case "on": 
							{
								Switch.updateValue(1); 
								break;
							}
					}
				})
				.on('set', function(newHomekitValue, callback, context)
							{
								// console.log(`New HomeKit value being sent to Hub is: ${newHomekitValue}`);
								switch(newHomekitValue == true)
								{

									case (true) : 
									{ 
										HubData.send(Switch.id, "switch", "on"); 
										break;
									}
									case (false): 
									{
										HubData.send(Switch.id, 'switch', "off"); 
										break;
									}
								}
								
								callback(null);
							} );
							
			var Level = thisService.addCharacteristic(new Characteristic.Brightness())
				Level.id = that.config.id;
				that.HubData.registerObjectToReceiveUpdates(Level.id, Level);

						
			Level
				.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					// console.log(chalk.yellow(`Received HubReport \n ${Object.getOwnPropertyNames(HubReport)} with name ${HubReport.name}`));
					if (HubReport.name != "level") return;
					Level.updateValue(HubReport.value); 
				})
				.on('set', function(newHomekitValue, callback, context)
							{
								// console.log(`New HomeKit value being sent to Hub is: ${newHomekitValue}`);

								HubData.send(Switch.id, 'setLevel', newHomekitValue)
								callback(null);
							} );

			services.push(thisService);

			break;
		}
	}
}