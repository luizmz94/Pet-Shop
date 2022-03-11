sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageBox"],
  function (BaseController, JSONModel, MessageBox) {
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
          showFooter: false,
        });

        this.setModel(oOrderModel, "orderView");

        this._data = {
          Products: [
            // {
            //   Category: "1",
            //   Description: "Teste",
            //   Quantity: "1",
            //   Unit: "KG",
            //   Value: "123",
            //   Total: "123",
            // },
            // {
            //   Category: "2",
            //   Description: "Teste 2",
            //   Quantity: "2",
            //   Unit: "KG",
            //   Value: "123",
            //   Total: "246",
            // },
          ],
        };

        this.jModel = new JSONModel(this._data);
      },

      onBeforeRendering: function () {
        this.byId("tableProducts").setModel(this.jModel, "servicesAndProducts");
      },

      onNavBack: function () {
        history.go(-1);
      },

      toggleFullScreen: function () {
        var bFullScreen = this.getModel("appView").getProperty(
          "/actionButtonsInfo/midColumn/fullScreen"
        );
        this.getModel("appView").setProperty(
          "/actionButtonsInfo/midColumn/fullScreen",
          !bFullScreen
        );
        if (!bFullScreen) {
          // store current layout and go full screen
          this.getModel("appView").setProperty(
            "/previousLayout",
            this.getModel("appView").getProperty("/layout")
          );
          this.getModel("appView").setProperty(
            "/layout",
            "MidColumnFullScreen"
          );
        } else {
          // reset to previous layout
          this.getModel("appView").setProperty(
            "/layout",
            this.getModel("appView").getProperty("/previousLayout")
          );
        }
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
      },

      _bindView: function (sObjectPath) {
        // Set busy indicator during view binding
        var oViewModel = this.getModel("orderView");

        // If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
        oViewModel.setProperty("/busy", false);

        this.getView().bindElement({
          path: sObjectPath,
          events: {
            change: this._onBindingChange.bind(this),
            dataRequested: function () {
              oViewModel.setProperty("/busy", true);
            },
            dataReceived: function () {
              oViewModel.setProperty("/busy", false);
            },
          },
        });
      },

      _onBindingChange: function () {
        var oView = this.getView(),
          oElementBinding = oView.getElementBinding();

        // No data for the binding
        if (!oElementBinding.getBoundContext()) {
          this.getRouter().getTargets().display("detailObjectNotFound");
          // if object could not be found, the selection in the master list
          // does not make sense anymore.
          this.getOwnerComponent().oListSelector.clearMasterListSelection();
          return;
        }
        var sPath = oElementBinding.getPath(),
          oResourceBundle = this.getResourceBundle(),
          oObject = oView.getModel().getObject(sPath),
          sObjectId = oObject.Cpf,
          sObjectName = oObject.Name,
          oViewModel = this.getModel("detailView");

        this.getOwnerComponent().oListSelector.selectAListItem(sPath);

        // this._clearOrderTable();

        // oViewModel.setProperty(
        //   "/shareSendEmailSubject",
        //   oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId])
        // );
        // oViewModel.setProperty(
        //   "/shareSendEmailMessage",
        //   oResourceBundle.getText("shareSendEmailObjectMessage", [
        //     sObjectName,
        //     sObjectId,
        //     location.href,
        //   ])
        // );
      },

      addRow: function (oArg) {
        this._data.Products.push({
          Id: "",
          ItemId: "",
          Category: "",
          ServiceProductid:"",
          Description: "",
          Quantity: "",
          Unit: "",
          Value: "",
          Total: "",
        });
        this.jModel.refresh(); //which will add the new record

        // var oViewModel = this.getModel("orderView");
        this.getModel("orderView").setProperty("/showFooter", true);
      },

      deleteRow: function (oEvent) {
        var deleteRecord = oEvent
          .getSource()
          .getBindingContext("servicesAndProducts")
          .getObject();
        for (var i = 0; i < this._data.Products.length; i++) {
          if (this._data.Products[i] == deleteRecord) {
            //	pop this._data.Products[i]
            this._data.Products.splice(i, 1); //removing 1 record from i th index.
            this.jModel.refresh();
            break; //quit the loop
          }
        }
        if (this._data.Products.length == 0) {
          this.getModel("orderView").setProperty("/showFooter", false);
        }
      },

      fetchRecords: function (oArg) {
        //data will be in this._data.Products
        this.byId("output").setValue(JSON.stringify(this._data.Products));
        console.log(this._data.Products);
      },

      _saveOrder: function (oEvent) {
        var oCurrentAnimal = oEvent.getSource().getBindingContext().getObject();
        var oOrderHeader = this.getView().getModel("OrderHeader").getData();

        oOrderHeader.Id = "1";
        oOrderHeader.Animalid = oCurrentAnimal.Id;
        oOrderHeader.Customerid = oCurrentAnimal.Cpf;
        oOrderHeader.Currency = "BRL";

        var oModel = this.getView().getModel();

        oModel.create("/OrderHeadersSet", oOrderHeader, {
          success: function (oData, oResponse) {
            if (oResponse.statusCode == "201") {
debugger;
              for (let key in this._data.Products) {
                var line = this._data.Products[key];

                line.Id = oData.Id;
                line.Itemid = (+key + 1).toString();
                line.Description = line.Description;
                line.Quantity = line.Quantity.toString();
                line.Unit = line.Unit;
                line.Value = line.Value.toString();
                
              }

              var payload = {
                Key: "1",
                Json: JSON.stringify(this._data.Products),
              };

              oModel.create("/OrderItemsJsonSet", payload, {
                success: function (oData, oResponse) {
                  debugger;
                },
                error: function (oError) {
                  debugger;
                },
              });

              // var aDeferredGroup = oModel
              //   .getDeferredGroups()
              //   .push("batchCreate");
              // oModel.setDeferredGroups(aDeferredGroup);

              // oModel.setDeferredGroups(
              //   oModel.getDeferredGroups().concat(["myGroupId"])
              // );

              // for (let key in this._data.Products) {
              //   var line = this._data.Products[key];
              //   var oOrderItem = this.getView().getModel("OrderItem").getData();

              //   var orderItemId = (+key + 1).toString();
              //   oOrderItem.Id = (+oData.Id + 1).toString();
              //   oOrderItem.Itemid = orderItemId;
              //   oOrderItem.Description = line.Description;
              //   oOrderItem.Quantity = line.Quantity.toString();
              //   oOrderItem.Unit = line.Unit;
              //   oOrderItem.Value = line.Value.toString();

              //   var mParameters = {
              //     groupId: "myGroupId",
              //     changeSetId: orderItemId,
              //   };

              //   debugger;
              //   oModel.create("/OrderItemsSet", oOrderItem, mParameters);
              //   // oModel.createEntry("/OrderItemsSet", oOrderItem);

              //   // oModel.create("/OrderItemsSet", oOrderItem, {
              //   //   success: function (oData, oResponse) {
              //   //     if (oResponse.statusCode == "201") {
              //   //       debugger;

              //   //     }
              //   //   }.bind(this),

              //   //   error: function (oError) {
              //   //     debugger;
              //   //     errors++
              //   //     var oSapMessage = JSON.parse(oError.responseText);
              //   //     var msg = oSapMessage.error.message.value;
              //   //     MessageBox.error(msg);
              //   //   },
              //   // });
              //   oModel.submitChanges({
              //     groupId: "myGroupId",
              //     success: function (oData, oResponse) {
              //       debugger;
              //       var msg = this.getResourceBundle().getText("created");
              //       MessageBox.success(msg);
              //     }.bind(this),
              //     error: function (oData, oResponse) {
              //       debugger;
              //       var oSapMessage = JSON.parse(oError.responseText);
              //       var msg = oSapMessage.error.message.value;
              //       MessageBox.error(msg);
              //     }.bind(this),
              //   });

              // }

              // // var mParameters = {
              // //   groupId: "myGroupId"
              // // };

              // // oModel.submitChanges(mParameters, {
            }
          }.bind(this),

          error: function (oError) {
            debugger;
            var oSapMessage = JSON.parse(oError.responseText);
            var msg = oSapMessage.error.message.value;
            MessageBox.error(msg);
          },
        });
      },

      _clearOrderTable: function () {
        this._data.Products.splice(0, 100);
        this.jModel.refresh();
        this.getModel("orderView").setProperty("/showFooter", false);
      },

      _onChangeQuantity: function (oEvent) {
        var rowChanged = oEvent
          .getSource()
          .getBindingContext("servicesAndProducts")
          .getObject();
        rowChanged.Total = rowChanged.Quantity * rowChanged.Value;
      },
      _onChangeTotal: function (oEvent) {
        var rowChanged = oEvent
          .getSource()
          .getBindingContext("servicesAndProducts")
          .getObject();
        rowChanged.Value = rowChanged.Total / rowChanged.Quantity;
      },
    });
  }
);
