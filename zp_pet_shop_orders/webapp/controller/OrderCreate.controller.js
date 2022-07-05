sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  function (BaseController, JSONModel, Fragment, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend(
      "petshop.zppetshoporders.controller.OrderCreate",
      {
        onInit: function (oEvent) {
          var oViewModel = new JSONModel({
            busy: false,
            delay: 0,
            showFooter: false,
            messageIcon: "sap-icon://message-success",
          });

          this.setModel(oViewModel, "createOrderView");

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

        onNavBack: function () {
          // this._smartTable = this.getView().byId("LineItemsSmartTable");
          // this._smartFilterBar.setLiveMode(false);
          // this._smartTable.rebind()
          // debugger;
          history.go(-1);
        },

        onValueHelpRequest: function (oEvent) {
          var sInputValue = oEvent.getSource().getValue(),
            oView = this.getView();

          if (!this._pValueHelpDialog) {
            this._pValueHelpDialog = Fragment.load({
              id: oView.getId(),
              name: "petshop.zppetshoporders.view.ValueHelpAnimal",
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }
          this._pValueHelpDialog.then(function (oDialog) {
            // Create a filter for the binding
            oDialog.getBinding("items").filter([
              // new Filter("Name", FilterOperator.Contains, sInputValue),

              new Filter({
                filters: [
                  new sap.ui.model.Filter(
                    "Name",
                    FilterOperator.Contains,
                    sInputValue
                  ),
                  new sap.ui.model.Filter(
                    "Customername",
                    FilterOperator.Contains,
                    sInputValue
                  ),
                ],
                and: false,
              }),
            ]);
            // Open ValueHelpDialog filtered by the input's value
            oDialog.open(sInputValue);
          });
        },

        onValueHelpSearch: function (oEvent) {
          var sValue = oEvent.getParameter("value");
          var oFilter =
            // new Filter("Name", FilterOperator.Contains, sValue);

            new Filter({
              filters: [
                new sap.ui.model.Filter(
                  "Name",
                  FilterOperator.Contains,
                  sValue
                ),
                new sap.ui.model.Filter(
                  "Customername",
                  FilterOperator.Contains,
                  sValue
                ),
              ],
              and: false,
            });

          oEvent.getSource().getBinding("items").filter([oFilter]);
        },

        onValueHelpClose: function (oEvent) {
          var oSelectedItem = oEvent.getParameter("selectedItem");
          oEvent.getSource().getBinding("items").filter([]);

          if (!oSelectedItem) {
            return;
          }

          var animalDetail = oSelectedItem.getBindingContext().getObject();
          this.byId("animalName").setValue(oSelectedItem.getTitle());

          this.byId("animalId").setText(animalDetail.Id);
          this.byId("customerName").setText(animalDetail.Customername);

          var oModelOrderHeader = this.getView().getModel("OrderHeader");
          oModelOrderHeader.setProperty("/Animalid", animalDetail.Id);
          oModelOrderHeader.setProperty("/Customerid", animalDetail.Cpf);
        },

        onAnimalNameChange: function (oEvent) {
          var oModelOrderHeader = this.getView().getModel("OrderHeader");

          var animalName = oEvent.getParameters().value;
          var animalSuggestion = oEvent
            .getSource()
            .getSuggestionItemByKey(animalName);

          if (animalSuggestion) {
            var animalDetail = animalSuggestion.getBindingContext().getObject();

            oModelOrderHeader.setProperty("/Animalid", animalDetail.Id);
            oModelOrderHeader.setProperty("/Customerid", animalDetail.Cpf);

            this.byId("animalId").setText(animalDetail.Id);
            this.byId("customerName").setText(animalDetail.Customername);
          } else {
            this.byId("animalName").setValue("");
            this.byId("animalId").setText("");
            this.byId("customerName").setText("");
          }
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
          this.getModel("createOrderView").setProperty("/showFooter", true);
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
            this.getModel("createOrderView").setProperty("/showFooter", false);
          }
        },

        _onChangeQuantity: function (oEvent) {
          var _oInput = oEvent.getSource();
          var value = _oInput.getValue();
          // val = val.replace(/[^\d]/g, '');
          _oInput.setValue(value);

          var rowChanged = oEvent
            .getSource()
            .getBindingContext("servicesAndProducts")
            .getObject();
          rowChanged.Total = rowChanged.Quantity * rowChanged.Value;
        },
        _onChangeTotal: function (oEvent) {
          // var _oInput = oEvent.getSource();
          // var val = _oInput.getValue();
          // // val = val.replace(/[^\d]/g, '');
          // debugger;
          // _oInput.setValue(val);

          var rowChanged = oEvent
            .getSource()
            .getBindingContext("servicesAndProducts")
            .getObject();

          // this.byId("InputValue").setValue(rowChanged.Total / rowChanged.Quantity);

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

        onBeforeRendering: function () {
          var tableOrderNew = this.byId("tableProducts");
          if (tableOrderNew) {
            tableOrderNew.setModel(this.jModel, "servicesAndProducts");
          }
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

        handleCancelBtnPress: function () {
          this.byId("openDialog").close();
          this._clearOrderTable();
        },

        _clearOrderTable: function () {
          this._data.Products.splice(0, 100);
          this.jModel.refresh();
        },

        _saveOrder: function (oEvent) {
          this.createOrderErro = false;
          this.onClearMessages();
          var oOrderHeader = this.getView().getModel("OrderHeader").getData();

          oOrderHeader.Id = "1";
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
                        // this.onNavBack();
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

        onClearMessages: function () {
          this.getModel("createOrderView").setProperty(
            "/messageIcon",
            "sap-icon://message-success"
          );

          sap.ui.getCore().getMessageManager().removeAllMessages();
          if (this._data.Products.length == 0) {
            this.getModel("createOrderView").setProperty("/showFooter", false);
          }
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

        onMessagePopoverPress: function (oEvent) {
          var oSourceControl = oEvent.getSource();
          this._getMessagePopover().then(function (oMessagePopover) {
            oMessagePopover.openBy(oSourceControl);
          });
        },

        _getMessagePopover: function () {
          var oView = this.getView();

          // create popover lazily (singleton)
          if (!this._pMessagePopover) {
            this._pMessagePopover = Fragment.load({
              id: oView.getId(),
              name: "petshop.zppetshoporders.view.MessagePopover",
            }).then(function (oMessagePopover) {
              oView.addDependent(oMessagePopover);
              return oMessagePopover;
            });
          }
          return this._pMessagePopover;
        },
      }
    );
  }
);
