sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
],
    function (JSONModel, Device) {
        "use strict";

        return {
            /**
             * Provides runtime information for the device the UI5 app is running on as a JSONModel.
             * @returns {sap.ui.model.json.JSONModel} The device model.
             */
            formatStatusState: function (sStatus) {

                switch (sStatus) {
                    case "COMPLETED":
                        return "Success";

                    case "FAILED":
                        return "Error";

                    case "PENDING":
                        return "Warning";

                    default:
                        return "None";
                }

            },

            statusIcon: function (sStatus) {

                switch (sStatus) {
                    case "COMPLETED":
                        return "sap-icon://accept";

                    case "FAILED":
                        return "sap-icon://error";

                    case "WARNING":
                        return "sap-icon://alert";

                    default:
                        return "sap-icon://information";
                }

            }

        };

    });