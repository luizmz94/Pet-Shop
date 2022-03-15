sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  function (
    BaseController,
    JSONModel,
    MessageBox,
    Fragment,
    Filter,
    FilterOperator
  ) {
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
          messageIcon: "sap-icon://message-success",
        });

        this.setModel(oOrderModel, "orderView");

        this._data = {
          Products: [],
        };

        this.jModel = new JSONModel(this._data);

        // set message model
        var oMessageManager;
        oMessageManager = sap.ui.getCore().getMessageManager();
        this.getView().setModel(oMessageManager.getMessageModel(), "message");

        // activate automatic message generation for complete view
        oMessageManager.registerObject(this.getView(), true);
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

        var orderHeadersPath =
          "/AnimalsSet('" + sAnimalId + "')/OrderHeadersSet";
        var oSmartTable = this.getView().byId("orderHeadersTable");
        oSmartTable.setTableBindingPath(orderHeadersPath);
        oSmartTable.rebindTable();
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

        this._clearOrderTable();
      },

      _onEditAnimal(oEvent) {
        this.getModel("appView").setProperty("/keys/animalId/blocked", true);

        var oView = this.getView();
        var oCurrentAnimal = oEvent.getSource().getBindingContext().getObject();

        var oModelAnimal = oView.getModel("Animal");
        oModelAnimal.setData(oCurrentAnimal);

        if (!this.byId("openDialog")) {
          Fragment.load({
            id: oView.getId(),
            name: "petshop.zppetshopanimals.view.AnimalRegister",
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            oDialog.open();
          });
        } else {
          this.byId("openDialog").open();
        }
        // this.gbEditing = true;
      },

      handleSaveBtnPress: function (oEvent) {
        var oModelAnimal = this.getView().getModel("Animal");
        var oModel = this.getView().getModel();

        var oCurrentAnimal = oModelAnimal.getData();
        var sUpdate = oModel.createKey("/AnimalsSet", {
          Id: oCurrentAnimal.Id,
        });
        oModel.update(sUpdate, oCurrentAnimal, {
          method: "PUT",
          success: function (data, oResponse) {
            var msg = this.getResourceBundle().getText("updated");
            MessageBox.success(msg);
            this.handleCancelBtnPress();
            oModel.refresh();
          }.bind(this),
          error: function (oError) {
            var oSapMessage = JSON.parse(oError.responseText);
            var msg = oSapMessage.error.message.value;
            MessageBox.error(msg);
          }.bind(this),
        });
      },

      clearModel: function (oModel) {
        oModel.setData({
          Id: "",
          Name: "",
          Species: "",
          Race: "",
          Age: "",
          Cpf: "",
        });
      },

      handleCancelBtnPress: function () {
        this.byId("openDialogAnimal").close();
        var oModelAnimal = this.getView().getModel("Animal");
        this.clearModel(oModelAnimal);
      },

      addRow: function (oArg) {
        this._data.Products.push({
          Id: "",
          Itemid: "",
          Category: "",
          Serviceproductid: "",
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
        this.createOrderErro = false;
        this.onClearMessages();

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
              oModel.setDeferredGroups(
                oModel.getDeferredGroups().concat(["myGroupId"])
              );

              var mParameters = {
                groupId: "myGroupId",
              };

              for (let key in this._data.Products) {
                var line = this._data.Products[key];

                var itemId = key;
                itemId = ++itemId;

                line.Id = oData.Id;
                line.Itemid = itemId.toString();
                line.Description = line.Description;
                line.Quantity = line.Quantity.toString();
                line.Unit = line.Unit;
                line.Value = line.Value.toString();
                line.Total = line.Total.toString();

                oModel.create("/OrderItemsSet", line, {
                  groupId: "myGroupId",
                  success: function (oData, oResponse) {
                    this._setMessageIcon();
                    if (
                      key == this._data.Products.length - 1 &&
                      this.createOrderErro == false
                    ) {
                      this._clearOrderTable();
                    }
                  }.bind(this),
                  error: function (oError) {
                    this._setMessageIcon();
                    this.createOrderErro = true;
                  }.bind(this),
                });
              }

              // oModel.setUseBatch(true);

              oModel.submitChanges({
                groupId: "myGroupId",
              });
            }
          }.bind(this),

          error: function (oError) {
            var oSapMessage = JSON.parse(oError.responseText);
            var msg = oSapMessage.error.message.value;
            MessageBox.error(msg);
          },
        });
      },

      _saveOrderWithJson: function (oEvent) {
        this.onClearMessages();

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
              for (let key in this._data.Products) {
                var line = this._data.Products[key];

                line.Id = oData.Id;
                line.Itemid = (+key + 1).toString();
                line.Description = line.Description;
                line.Quantity = line.Quantity.toString();
                line.Unit = line.Unit;
                line.Value = line.Value.toString();
                line.Total = line.Total.toString();
              }
              var payload = {
                Key: "1",
                Json: JSON.stringify(this._data.Products),
              };

              oModel.create("/OrderItemsJsonSet", payload, {
                success: function (oData, oResponse) {
                  this._setMessageIcon();
                  // var msg = this.getResourceBundle().getText("createOrderSucess");
                  // MessageBox.success(msg);
                }.bind(this),
                error: function (oError) {
                  this._setMessageIcon();
                  // var oSapMessage = JSON.parse(oError.responseText);
                  // var msg = oSapMessage.error.message.value;
                  // MessageBox.error(msg);
                }.bind(this),
              });
            }
          }.bind(this),

          error: function (oError) {
            var oSapMessage = JSON.parse(oError.responseText);
            var msg = oSapMessage.error.message.value;
            MessageBox.error(msg);
          },
        });
      },

      _clearOrderTable: function () {
        this._data.Products.splice(0, 100);
        this.jModel.refresh();
        // var messages = this.getView().getModel("message").getData();
        // if (messages.length == 0) {
        //   this.getModel("orderView").setProperty("/showFooter", false);
        // }
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

      _onChangeDescription: function (oEvent) {
        var rowChanged = oEvent
          .getSource()
          .getBindingContext("servicesAndProducts")
          .getObject();

        var suggestions = oEvent
          .getSource()
          .getSuggestionItemByKey(rowChanged.Description);

        if (suggestions) {
          var suggestionItem = suggestions.getBindingContext().getObject();
          rowChanged.Value = suggestionItem.Value;
          rowChanged.Category = suggestionItem.Category;
          rowChanged.Unit = suggestionItem.Unit;
          if (suggestionItem.Category == "SRV") {
            rowChanged.Quantity = "1";
            rowChanged.Total = rowChanged.Value;
          }
        } else {
          rowChanged.Value = "";
          rowChanged.Category = "";
          rowChanged.Unit = "";
          rowChanged.Quantity = "";
          rowChanged.Total = "";
        }
      },

      onMessagePopoverPress: function (oEvent) {
        var oSourceControl = oEvent.getSource();
        this._getMessagePopover().then(function (oMessagePopover) {
          oMessagePopover.openBy(oSourceControl);
        });
      },

      onClearMessages: function () {
        this.getModel("orderView").setProperty(
          "/messageIcon",
          "sap-icon://message-success"
        );

        sap.ui.getCore().getMessageManager().removeAllMessages();
        if (this._data.Products.length == 0) {
          this.getModel("orderView").setProperty("/showFooter", false);
        }
      },

      //################ Private APIs ###################

      _getMessagePopover: function () {
        var oView = this.getView();

        // create popover lazily (singleton)
        if (!this._pMessagePopover) {
          this._pMessagePopover = Fragment.load({
            id: oView.getId(),
            name: "petshop.zppetshopanimals.view.MessagePopover",
          }).then(function (oMessagePopover) {
            oView.addDependent(oMessagePopover);
            return oMessagePopover;
          });
        }
        return this._pMessagePopover;
      },

      _setMessageIcon: function () {
        var messages = this.getView().getModel("message").getData();

        for (let lin in messages) {
          var type = messages[lin].type;
          if (type != "Success") {
            this.getModel("orderView").setProperty(
              "/messageIcon",
              "sap-icon://alert"
            );
          }
        }
      },

      _readOrderAndItems: function (oEvent) {
        var animalPath = oEvent.getSource().getBindingContext().getPath();
        var orderHeadersPath = animalPath + "/OrderHeadersSet";

        var oModel = this.getView().getModel();

        oModel.read(orderHeadersPath, {
          success: function (oData, oResponse) {
            var teste = oData.results;
            debugger;
          }.bind(this),
          error: function (oError) {
            debugger;
          }.bind(this),
        });
      },
    });
  }
);
