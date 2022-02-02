sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/core/Fragment"],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, Fragment) {
    "use strict";

    return Controller.extend(
      "petshop.zppetshopcustomer.controller.CustomerView",
      {
        onInit: function () {},
        onBeforeExport: function (oEvt) {
          var mExcelSettings = oEvt.getParameter("exportSettings");

          // Disable Worker as Mockserver is used in Demokit sample
          mExcelSettings.worker = false;
        },
        onCreate: function () {
          var oView = this.getView();
          // create dialog lazily
          if (!this.byId("openDialog")) {
            // load asynchronous XML fragment
            Fragment.load({
              id: oView.getId(),
              name: "petshop.zppetshopcustomer.view.Register",
              controller: this,
            }).then(function (oDialog) {
              // connect dialog to the root view
              //of this component (models, lifecycle)
              oView.addDependent(oDialog);
              oDialog.open();
            });
          } else {
            this.byId("openDialog").open();
          }
        },

        closeDialog: function () {
          this.byId("openDialog").close();
        },
      }
    );
  }
);
