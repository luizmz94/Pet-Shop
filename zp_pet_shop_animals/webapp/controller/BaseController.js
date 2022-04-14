sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/Dialog",
    "sap/suite/ui/commons/imageeditor/ImageEditor",
    "sap/suite/ui/commons/imageeditor/ImageEditorContainer",
    "sap/ui/core/Fragment",
  ],
  function (Controller, History, Dialog, ImageEditor, ImageEditorContainer, Fragment) {
    "use strict";

    return Controller.extend(
      "petshop.zppetshopanimals.controller.BaseController",
      {
        /**
         * Convenience method for accessing the router in every controller of the application.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
          return this.getOwnerComponent().getRouter();
        },

        /**
         * Convenience method for getting the view model by name in every controller of the application.
         * @public
         * @param {string} sName the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
          return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model in every controller of the application.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
          return this.getView().setModel(oModel, sName);
        },

        /**
         * Convenience method for getting the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
          return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Event handler for navigating back.
         * It there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the master route.
         * @public
         */
        onNavBack: function () {
          var sPreviousHash = History.getInstance().getPreviousHash();

          if (sPreviousHash !== undefined) {
            history.go(-1);
          } else {
            this.getRouter().navTo("master", {}, true);
          }
        },

        onTakePicture: function (oEvent) {
          var oButton = oEvent.getSource();
          var that = this;

          if (!this._oResponsivePopover) {
            this._oResponsivePopover = new sap.m.ResponsivePopover({
              placement: "Auto",
              verticalScrolling: false,
              showHeader: false,
              beginButton: new sap.m.Button({
                text: "Capture Photo",
                press: function (oEvent) {
                  var canvas = document.createElement("canvas");
                  canvas.width = player.videoWidth;
                  canvas.height = player.videoHeight;
                  canvas
                    .getContext("2d")
                    .drawImage(player, 0, 0, canvas.width, canvas.height);
                  that._oResponsivePopover.close();
                  player.srcObject.getTracks()[0].stop();
                  that.openImageEditor(canvas.toDataURL());
                },
              }),
              content: [
                new sap.ui.core.HTML({
                  content: "<video id='player' autoplay></video>",
                }),
              ],
              endButton: new sap.m.Button({
                text: "Cancel",
                press: function () {
                  that._oResponsivePopover.close();
                  player.srcObject.getTracks()[0].stop();
                },
              }),
              ariaLabelledBy: oButton.getId(),
            });
          }
          this._oResponsivePopover.addStyleClass("sapUiContentPadding");
          this.getView().addDependent(this._oResponsivePopover);
          this._oResponsivePopover.openBy(oButton);

          var handleSucess = function (stream) {
            player.srcObject = stream;
          };

          navigator.mediaDevices
            .getUserMedia({
              video: true,
            })
            .then(handleSucess.bind(this));
        },

        openImageEditor: function (sImageScr) {
          if (!this.oImageEditorDialog) {
            this.oImageEditorDialog = new Dialog({
              title: this.getResourceBundle().getText("imageEditor"),
              verticalScrolling: false,
              stretch: true,
              content: [
                new ImageEditorContainer({
                  imageEditor: new ImageEditor({
                    src: sImageScr,
                  }),
                }),
              ],
              beginButton: new sap.m.Button({
                text: this.getResourceBundle().getText("close"),
                press: function () {
                  this.oImageEditorDialog.close();
                }.bind(this),
              }),
            });
          } else {
            this.oImageEditorDialog.getContent()[0].getImageEditor().setSrc(sImageScr);
          }

          this.oImageEditorDialog.open();
        },

        onChangeFileUploader: function (oEvent) {
          var fileDetails = oEvent.getParameters("file").files[0];
          sap.ui.getCore().fileUploadArr = [];
          if (fileDetails) {
            var mimeDet = fileDetails.type,
              fileName = fileDetails.name;
  
            // Calling method....
            this.base64coonversionMethod(mimeDet, fileName, fileDetails, "001");
            
          } else {
            sap.ui.getCore().fileUploadArr = [];
          }
        },

        base64coonversionMethod: function (
          fileMime,
          fileName,
          fileDetails,
          DocNum
        ) {
          var that = this;
          if (!FileReader.prototype.readAsBinaryString) {
            FileReader.prototype.readAsBinaryString = function (fileData) {
              var binary = "";
              var reader = new FileReader();
              reader.onload = function (e) {
                var bytes = new Uint8Array(reader.result);
                var length = bytes.byteLength;
                for (var i = 0; i < length; i++) {
                  binary += String.fromCharCode(bytes[i]);
                }
                that.base64ConversionRes = btoa(binary);
                sap.ui.getCore().fileUploadArr.push({
                  DocumentType: DocNum,
                  MimeType: fileMime,
                  FileName: fileName,
                  Content: that.base64ConversionRes,
                });
              };
              reader.readAsArrayBuffer(fileData);
            };
          }
          var reader = new FileReader();
          reader.onload = function (readerEvt) {
            var binaryString = readerEvt.target.result;
            that.base64ConversionRes = btoa(binaryString);

            var string =
              "data:" + fileMime + ";base64," + that.base64ConversionRes;
            that.openImageEditor(string);

            sap.ui.getCore().fileUploadArr.push({
              DocumentType: DocNum,
              MimeType: fileMime,
              FileName: fileName,
              Content: that.base64ConversionRes,
            });
          };
          reader.readAsBinaryString(fileDetails);
        },

        getImgFromUrl: function (oEvent) {
          var pictureUrl = oEvent.getSource().getValue();
          this.openImageEditor(pictureUrl);
        },


        loadUploadDialog: function (oEvent) {
          if (!this.byId("uploadPicture")) {
            Fragment.load({
              id: this.getView().getId(),
              name: "petshop.zppetshopanimals.view.UploadPicture",
              controller: this,
            }).then(
              function (oDialog) {
                // connect dialog to the root view of this component (models, lifecycle)
                this.getView().addDependent(oDialog);
                oDialog.addStyleClass(
                  this.getOwnerComponent().getContentDensityClass()
                );
                oDialog.open();
              }.bind(this)
            );
          } else {
            this.byId("uploadPicture").open();
          }
        },
  
        closeUploadDialog: function (oEvent) {
          this.byId("InputUrl").setValue("");
          this.byId("uploadPicture").close();
        }
      }
    );
  }
);
