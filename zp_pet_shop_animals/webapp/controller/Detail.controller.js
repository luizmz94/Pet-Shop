sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/library",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  function (
    BaseController,
    JSONModel,
    formatter,
    mobileLibrary,
    Fragment,
    MessageBox,
    Filter,
    FilterOperator
  ) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return BaseController.extend("petshop.zppetshopanimals.controller.Detail", {
      formatter: formatter,

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      onInit: function () {
        // Model used to manipulate control states. The chosen values make sure,
        // detail page is busy indication immediately so there is no break in
        // between the busy indication for loading the view's meta data
        var oViewModel = new JSONModel({
          busy: false,
          delay: 0,
          lineItemListTitle: this.getResourceBundle().getText(
            "detailLineItemTableHeading"
          ),
          tableNoDataText: this.getResourceBundle().getText(
            "detailLineItemTableNoDataText"
          ),
        });

        this.oSF = this.getView().byId("searchField");

        this.getRouter()
          .getRoute("object")
          .attachPatternMatched(this._onObjectMatched, this);

        this.setModel(oViewModel, "detailView");

        this.getOwnerComponent()
          .getModel()
          .metadataLoaded()
          .then(this._onMetadataLoaded.bind(this));
      },

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      /**
       * Event handler when the share by E-Mail button has been clicked
       * @public
       */
      onSendEmailPress: function () {
        var oViewModel = this.getModel("detailView");

        URLHelper.triggerEmail(
          null,
          oViewModel.getProperty("/shareSendEmailSubject"),
          oViewModel.getProperty("/shareSendEmailMessage")
        );
      },

      /**
       * Updates the item count within the line item table's header
       * @param {object} oEvent an event containing the total number of items in the list
       * @private
       */
      onListUpdateFinished: function (oEvent) {
        var sTitle,
          iTotalItems = oEvent.getParameter("total"),
          oViewModel = this.getModel("detailView");

        // only update the counter if the length is final
        if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
          if (iTotalItems) {
            sTitle = this.getResourceBundle().getText(
              "detailLineItemTableHeadingCount",
              [iTotalItems]
            );
          } else {
            //Display 'Line Items' instead of 'Line items (0)'
            sTitle = this.getResourceBundle().getText(
              "detailLineItemTableHeading"
            );
          }
          oViewModel.setProperty("/lineItemListTitle", sTitle);
        }
      },

      /* =========================================================== */
      /* begin: internal methods                                     */
      /* =========================================================== */

      /**
       * Binds the view to the object path and expands the aggregated line items.
       * @function
       * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
       * @private
       */
      _onObjectMatched: function (oEvent) {
        var sObjectId = oEvent.getParameter("arguments").objectId;
        this.sCustomerCpf = sObjectId;
        this.getModel("device").setProperty("/layout", "TwoColumnsMidExpanded");
        this.getModel()
          .metadataLoaded()
          .then(
            function () {
              var sObjectPath = this.getModel().createKey("CustomersSet", {
                Cpf: sObjectId,
              });
              this._bindView("/" + sObjectPath);
            }.bind(this)
          );
      },

      /**
       * Binds the view to the object path. Makes sure that detail view displays
       * a busy indicator while data for the corresponding element binding is loaded.
       * @function
       * @param {string} sObjectPath path to the object to be bound to the view.
       * @private
       */
      _bindView: function (sObjectPath) {
        // Set busy indicator during view binding
        var oViewModel = this.getModel("detailView");

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

        oViewModel.setProperty(
          "/shareSendEmailSubject",
          oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId])
        );
        oViewModel.setProperty(
          "/shareSendEmailMessage",
          oResourceBundle.getText("shareSendEmailObjectMessage", [
            sObjectName,
            sObjectId,
            location.href,
          ])
        );
      },

      _onMetadataLoaded: function () {
        // Store original busy indicator delay for the detail view
        var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
          oViewModel = this.getModel("detailView"),
          oLineItemTable = this.byId("lineItemsList"),
          iOriginalLineItemTableBusyDelay =
            oLineItemTable.getBusyIndicatorDelay();

        // Make sure busy indicator is displayed immediately when
        // detail view is displayed for the first time
        oViewModel.setProperty("/delay", 0);
        oViewModel.setProperty("/lineItemTableDelay", 0);

        oLineItemTable.attachEventOnce("updateFinished", function () {
          // Restore original busy indicator delay for line item table
          oViewModel.setProperty(
            "/lineItemTableDelay",
            iOriginalLineItemTableBusyDelay
          );
        });

        // Binding the view will set it to not busy - so the view is always busy if it is not bound
        oViewModel.setProperty("/busy", true);
        // Restore original busy indicator delay for the detail view
        oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
      },

      onSearch: function (oEvent) {
        debugger;
        if (oEvent.getParameters().refreshButtonPressed) {
          // Search field's 'refresh' button has been pressed.
          // This is visible if you select any master list item.
          // In this case no new search is triggered, we only
          // refresh the list binding.
          this.onRefresh();
        } else {
          var aTableSearchState = [];
          var sQuery = oEvent.getParameter("query");

          if (sQuery && sQuery.length > 0) {
            aTableSearchState = [
              new Filter("Name", FilterOperator.Contains, sQuery),
            ];
          }
          this._applySearch(aTableSearchState);
        }
      },

      _applySearch: function (aTableSearchState) {
        debugger;
        var oTable = this.byId("lineItemsList"),
          oViewModel = this.getModel("detailView");
        oTable.getBinding("items").filter(aTableSearchState, "Application");
        // changes the noDataText of the list in case there are no filter results
        if (aTableSearchState.length !== 0) {
          oViewModel.setProperty(
            "/tableNoDataText",
            this.getResourceBundle().getText("detailLineItemTableNoDataText")
          );
        }
      },

      onRefresh: function () {
        var oTable = this.byId("lineItemsList");
        oTable.getBinding("items").refresh();
      },


      /**
       * Set the full screen mode to false and navigate to master page
       */
      onCloseDetailPress: function () {
        this.getModel("appView").setProperty(
          "/actionButtonsInfo/midColumn/fullScreen",
          false
        );
        this.getModel("appView").setProperty("/lessButton/visible", false);
        // No item should be selected on master after detail page is closed
        this.getOwnerComponent().oListSelector.clearMasterListSelection();
        this.getRouter().navTo("master");
      },

      /**
       * Toggle between full and non full screen mode.
       */
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

      _onCreateAnimal: function () {
        this.gbEditing = false;
        var oView = this.getView();
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
      },

      _onDeleteAnimal: function () {
        var oModel = this.getView().getModel();
        var oTable = this.getView().byId("lineItemsList");
        var oItems = oTable.getSelectedContextPaths();

        for (var item in oItems) {
          oModel.remove(oItems[item], {
            success: function (oData, oResponse) {},
            error: function (oError) {
              var oSapMessage = JSON.parse(oError.responseText);
              var msg = oSapMessage.error.message.value;
              MessageBox.error(msg);
            },
          });
        }
        oTable.removeSelections();
      },

      _onEditCustomer(oEvent) {
        this.getModel("appView").setProperty("/keys/cpf/blocked", true);

        var oView = this.getView();

        var oCurrentCustomer = oEvent
          .getSource()
          .getBindingContext()
          .getObject();

        var oModelCustomer = oView.getModel("Customer");
        oModelCustomer.setData(oCurrentCustomer);

        if (!this.byId("openDialog")) {
          Fragment.load({
            id: oView.getId(),
            name: "petshop.zppetshopanimals.view.Register",
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            oDialog.open();
          });
        } else {
          this.byId("openDialog").open();
        }
        this.gbEditing = true;
      },

      handleSaveBtnPressCustomer: function (oEvent) {
        var oModelCustomer = this.getView().getModel("Customer");
        var oModel = this.getView().getModel();

        if (!this.gbEditing) {
          oModel.create("/CustomersSet", oModelCustomer.getData(), {
            success: function (oData, oResponse) {
              if (oResponse.statusCode == "201") {
                var msg = this.getResourceBundle().getText("created");
                // MessageBox.success(msg, { onClose: this.doMessageboxAction() });
                MessageBox.success(msg);
                this.clearModel(oModelCustomer);
                this.handleCancelBtnPressCustomer();
              }
            }.bind(this),

            error: function (oError) {
              var oSapMessage = JSON.parse(oError.responseText);
              var msg = oSapMessage.error.message.value;
              MessageBox.error(msg);
            },
          });
        } else {
          var oCurrentCustomer = oModelCustomer.getData();
          var sUpdate = oModel.createKey("/CustomersSet", {
            Cpf: oCurrentCustomer.Cpf,
          });
          oModel.update(sUpdate, oCurrentCustomer, {
            method: "PUT",
            success: function (data, oResponse) {
              var msg = this.getResourceBundle().getText("updated");
              MessageBox.success(msg);
              this.clearModel(oModelCustomer);
              this.handleCancelBtnPressCustomer();
              oModel.refresh();
            }.bind(this),
            error: function (oError) {
              var oSapMessage = JSON.parse(oError.responseText);
              var msg = oSapMessage.error.message.value;
              MessageBox.error(msg);
            }.bind(this),
          });
        }
      },

      handleCancelBtnPressCustomer: function () {
        this.byId("openDialog").close();
        var modelCustomer = this.getView().getModel("Customer");
        this.clearModel(modelCustomer);
      },

      _onDeleteCustomer(oEvent) {
        var oModel = this.getView().getModel();
        var sDelete = oModel.createKey("/CustomersSet", {
          Cpf: this.sCustomerCpf,
        });

        oModel.remove(sDelete, {
          success: function (oData, oResponse) {
            this.onCloseDetailPress();
          }.bind(this),
          error: function (oError) {
            var oSapMessage = JSON.parse(oError.responseText);
            var msg = oSapMessage.error.message.value;
            MessageBox.error(msg);
          }.bind(this),
        });
      },

      handleSaveBtnPress: function (oEvent) {
        var oModelAnimal = this.getView().getModel("Animal");
        var oModel = this.getView().getModel();
        var oCurrentAnimal = oModelAnimal.getData();
        oCurrentAnimal.Id = "1";
        oCurrentAnimal.Cpf = this.sCustomerCpf;

        // faltou o ID do animal

        if (!this.gbEditing) {
          oModel.create("/AnimalsSet", oModelAnimal.getData(), {
            success: function (oData, oResponse) {
              if (oResponse.statusCode == "201") {
                var msg = this.getResourceBundle().getText("created");
                // MessageBox.success(msg, { onClose: this.doMessageboxAction() });
                MessageBox.success(msg);
                this.clearModel(oModelAnimal);
                this.handleCancelBtnPress();
              }
            }.bind(this),

            error: function (oError) {
              var oSapMessage = JSON.parse(oError.responseText);
              var msg = oSapMessage.error.message.value;
              MessageBox.error(msg);
            },
          });
        } else {
          oCurrentAnimal = oModelAnimal.getData();
          var sUpdate = oModel.createKey("/AnimalsSet", {
            Id: oModelAnimal.Id,
          });
          oModel.update(sUpdate, oCurrentAnimal, {
            method: "PUT",
            success: function (data, oResponse) {
              var msg = this.getResourceBundle().getText("updated");
              MessageBox.success(msg);
              this.clearModel(oCurrentAnimal);
              this.handleCancelBtnPress();
              oModel.refresh();
            }.bind(this),
            error: function (oError) {
              var oSapMessage = JSON.parse(oError.responseText);
              var msg = oSapMessage.error.message.value;
              MessageBox.error(msg);
            }.bind(this),
          });
        }
      },

      handleCancelBtnPress: function () {
        this.byId("openDialog").close();
        var oModelAnimal = this.getView().getModel("Animal");
        this.clearModel(oModelAnimal);
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


      onPress: function(oEvent) {
        var oItem = oEvent.getSource();
        var sPath = oItem.getBindingContext().getPath("Name");
        var sPath1 = oItem.getBindingContext().getPath("Branch");
        var oTable = this.getView().byId("abc");
        var modelData = oTable.getModel();
        var data = modelData.getProperty(sPath);
        var data1 = modelData.getProperty(sPath1);
  
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("page2", {
          invoicePath: data,
          invoicePath1: data1
        });
      },


    });
  }
);
