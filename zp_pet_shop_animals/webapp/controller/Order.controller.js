sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel"],
  function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("petshop.zppetshopanimals.controller.Order", {
      onInit: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter
          .getRoute("order")
          .attachPatternMatched(this._onObjectMatched, this);

        var oOrderModel = new JSONModel({
          busy: false,
          delay: 0,
        });

        this.setModel(oOrderModel, "orderView");
      },
      onNavBack: function () {
        history.go(-1);
      },
      _onObjectMatched: function (oEvent) {
        var sAnimalId = oEvent.getParameter("arguments").animalId;
        this.getModel()
          .metadataLoaded()
          .then(
            function () {
              var sAnimalPath = this.getModel().createKey("AnimalsSet", {
                Id: sAnimalId,
              });
              this._bindView("/" + sAnimalPath);
            }.bind(this)
          );
        // var cc = oEvent.getParameter("arguments").invoicePath;
        // var textId = this.getView().byId("myTestId");
        // textId.setText(cc);
        // var cc1 = oEvent.getParameter("arguments").invoicePath1;
        // var textId1 = this.getView().byId("TestId");
        // textId1.setText(cc1);
      },

      _bindView: function (sObjectPath) {
        // Set busy indicator during view binding
        var oViewModel = this.getModel("orderView");

        // If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
        oViewModel.setProperty("/busy", false);

        this.getView().bindElement({
          path: sObjectPath,
          events: {
            // change: this._onBindingChange.bind(this),
            dataRequested: function () {
              oViewModel.setProperty("/busy", true);
            },
            dataReceived: function () {
              oViewModel.setProperty("/busy", false);
            },
          },
        });
      },
    });
  }
);
