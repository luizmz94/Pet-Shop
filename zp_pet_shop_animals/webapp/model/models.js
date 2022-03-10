sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		}, 

		createAnimalsModel: function () {
			var oModel = new JSONModel({
			  Id: "",
			  Name: "",
			  Species: "",
			  Race: "",
			  Age:0,
			  Cpf:""
			});
			return oModel;
		  },
		  createCustomerModel: function () {
			var oModel = new JSONModel({
			  Cpf: "",
			  Name: "",
			  Address: "",
			  Telephone: "",
			});
			return oModel;
		  }, 
		  createOrderHeaderModel: function () {
			var oModel = new JSONModel({
			  Id: "",
			  Animalid: "",
			  Customerid: "",
			  Currency: ""
			});
			return oModel;
		  },
		  createOrderItemModel: function () {
			var oModel = new JSONModel({
			  Id: "",
			  Itemid: "",
			  Description: "",
			  Quantity: 0,
			  Unit: "", 
			  Value: 0
			});
			return oModel;
		  }


	};
});