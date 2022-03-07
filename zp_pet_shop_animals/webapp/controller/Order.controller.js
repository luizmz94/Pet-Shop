sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	return Controller.extend("petshop.zppetshopanimals.controller.Order", {
		onInit: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("order").attachPatternMatched(this._onObjectMatched, this);
		},
		onNavBack: function() {
			history.go(-1);
		},
		_onObjectMatched: function(oEvent) {
			var cc = oEvent.getParameter("arguments").invoicePath;
			var textId = this.getView().byId("myTestId");
			textId.setText(cc);
			var cc1 = oEvent.getParameter("arguments").invoicePath1;
			var textId1 = this.getView().byId("TestId");
			textId1.setText(cc1);
		}

	});
});
