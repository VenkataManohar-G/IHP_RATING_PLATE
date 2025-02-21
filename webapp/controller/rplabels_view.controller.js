sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/library",
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet",
    "sap/m/Dialog",
    "sap/m/library",
    "sap/m/Button",
    "sap/m/Text",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/m/SearchField",
    "sap/ui/table/Column",
    "sap/m/Column",
    "sap/m/Label",
    "sap/ui/model/type/String",
    "sap/ui/comp/library",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/ui/core/message/Message"
], (Controller, coreLibrary, exportLibrary, Spreadsheet, Dialog, mobileLibrary, Button, Text, Sorter, Filter,
    SearchField, UIColumn, MColumn, Label, TypeString, compLibrary, FilterOperator, Fragment, Message) => {
    "use strict";
    var addDefaultEntries = [];
    var addEntriesLength = 0,oBusyDialog;
    var oAddEntryModel,omaterialsModel;
    var i;
    var ValueState = coreLibrary.ValueState;
    return Controller.extend("rplabels.controller.rplabels_view", {
        onInit() {
            this._add_initial_entries();
        },
        _add_initial_entries: function () {
            var that = this;
            oAddEntryModel = new sap.ui.model.json.JSONModel();
            for (i = 0; i <= 9; i++) {
                var addDefaultEntry = {};
                addDefaultEntry.Id = i;
                addDefaultEntry.Label = '';
                addDefaultEntry.Material = '';
                addDefaultEntries.push(addDefaultEntry);
            }
            oAddEntryModel.setData(addDefaultEntries);
            that.getView().setModel(oAddEntryModel, "Entries");
            oAddEntryModel.refresh(true);
        },
        /*Plant Value Help*/
        onPlantVH: function (oEvent) {
            this._oBasicSearchFieldWithSuggestionsPlant = new SearchField();
            this.pDialogWithSuggestions = this.loadFragment({
                name: "rplabels.view.PlantVH"
            }).then(function (oDialogSuggestions) {
                var oFilterBar = oDialogSuggestions.getFilterBar(), oPlantID, oPlantName, oColumnEmpName,
                    oColumnEmployeeId, oColumnBusinessPartner, oUserIdVH, oCompanyCodeVH, oCostcenterVH;
                this._oVHPlantWithSuggestions = oDialogSuggestions;
                this.getView().addDependent(oDialogSuggestions);
                // Set key fields for filtering in the Define Conditions Tab
                oDialogSuggestions.setRangeKeyFields([{
                    label: "Plant",
                    key: "Plant",
                    type: "string",
                    typeInstance: new TypeString({}, {
                        maxLength: 10
                    })
                }]);
                // Set Basic Search for FilterBar
                oFilterBar.setFilterBarExpanded(false);
                oFilterBar.setBasicSearch(this._oBasicSearchFieldWithSuggestionsPlant);

                // Trigger filter bar search when the basic search is fired
                this._oBasicSearchFieldWithSuggestionsPlant.attachSearch(function () {
                    oFilterBar.search();
                });
                oDialogSuggestions.getTableAsync().then(function (oTable) {
                    // For Desktop and tabled the default table is sap.ui.table.Table
                    if (oTable.bindRows) {
                        // Bind rows to the ODataModel and add columns
                        oTable.bindAggregation("rows", {
                            path: "/Plants",
                            events: {
                                dataReceived: function () {
                                    oDialogSuggestions.update();
                                }
                            }
                        });
                        oPlantID = new UIColumn({ label: new Label({ text: "Plant" }), template: new Text({ wrapping: false, text: "{Plant}" }) });
                        oPlantID.data({
                            fieldName: "Plant"
                        });
                        oTable.addColumn(oPlantID);

                        oPlantName = new UIColumn({ label: new Label({ text: "PlantName" }), template: new Text({ wrapping: false, text: "{PlantName}" }) });
                        oPlantName.data({
                            fieldName: "PlantName"
                        });
                        oTable.addColumn(oPlantName);
                    }
                }.bind(this));
                oDialogSuggestions.open();
            }.bind(this));
        },
        onValueHelpPlantVHOkPress: async function (oEvent) {
            var that = this,
                aTokens = oEvent.getParameter("tokens"),
                oModel = this.getView().getModel();
            omaterialsModel = new sap.ui.model.json.JSONModel();
            oBusyDialog = new sap.m.BusyDialog({
                title: "Loading Materials",
                text: "Please wait....."
            });
            oBusyDialog.open();
            if (aTokens.length > 0) {
                var oText = aTokens[0].getKey();
                var oselectedSet = aTokens[0].getAggregation("customData");
                var oselectedData = oselectedSet[0].getProperty("value");
                var oPlant = this.byId("id_plant");
                oPlant.setValue(oText);
                let oMaterials = await that._getPlantmaterials(oModel, oText);
                if(oMaterials){
                    omaterialsModel.setData(oMaterials);
                    that.getView().setModel(omaterialsModel, "Materials");
                    oBusyDialog.close();
                }else{
                    omaterialsModel.setData(oMaterials);
                    omaterialsModel.refresh();
                    that.getView().setModel(omaterialsModel, "Materials");
                    oBusyDialog.close();
                }
            }
            this._oVHPlantWithSuggestions.close();
        },
        onValueHelpPlantVHCancelPress: function (oEvent) {
            this._oVHPlantWithSuggestions.close();
        },
        onValueHelpPlantVHAfterClose: function (oEvent) {
            this._oVHPlantWithSuggestions.destroy();
        },
        onFilterBarWithSuggestionsPlantVHSearch: function (oEvent) {
            var sSearchQuery = this._oBasicSearchFieldWithSuggestionsPlant.getValue(),
                aSelectionSet = oEvent.getParameter("selectionSet"),
                aFilters = aSelectionSet.reduce(function (aResult, oControl) {
                    if (oControl.getValue()) {
                        aResult.push(new Filter({
                            path: oControl.getName(),
                            operator: FilterOperator.Contains,
                            value1: oControl.getValue()
                        }));
                    }

                    return aResult;
                }, []);

            aFilters.push(new Filter({
                filters: [
                    new Filter({ path: "PlantName", operator: FilterOperator.Contains, value1: sSearchQuery }),
                ],
                and: false
            }));

            this._filterTableWithSuggestionsPlant(new Filter({
                filters: aFilters,
                and: true
            }));
        },
        _filterTableWithSuggestionsPlant: function (oFilter) {
            var oVHDPlant = this._oVHPlantWithSuggestions;
            oVHDPlant.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }
                oVHDPlant.update();
            });
        },
        onPlantChange: async function (oEvent) {
            var that = this,
                oValidatedPlant = oEvent.getSource(),
                sSelectedKey = oEvent.getParameter("newValue"),
                oModel = this.getView().getModel();
                omaterialsModel = new sap.ui.model.json.JSONModel();
            let oPlant = await that._plantValidation(oModel, sSelectedKey);
            if (sSelectedKey !== oPlant) {
                oValidatedPlant.setValueState(ValueState.Error);
                oValidatedPlant.setValueStateText("Please enter a valid Plant!");
            } else {
                oValidatedPlant.setValueState(ValueState.None);
                let oMaterials = await that._getPlantmaterials(oModel, sSelectedKey);
                if(oMaterials){
                    omaterialsModel.setData(oMaterials);
                    that.getView().setModel(omaterialsModel, "Materials");
                }else{
                    omaterialsModel.setData(oMaterials);
                    omaterialsModel.refresh();
                    that.getView().setModel(omaterialsModel, "Materials");
                }
            }
        },
        _plantValidation: function (oModel, sInputValue) {
            return new Promise((resolve, reject) => {
                oModel.read("/Plants", {
                    filters: [new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, sInputValue)],
                    success: function (oData) {
                        var aPlants = oData.results;
                        if (aPlants.length > 0) {
                            resolve(aPlants[0].Plant);
                        } else {
                            resolve();
                        }
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },
        _getPlantmaterials: function (oModel, sInputValue){
            return new Promise((resolve, reject) => {
                oModel.read("/Materials", {
                    filters: [new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, sInputValue)],
                    success: function (oData) {
                        var aMaterials = oData.results;
                        if (aMaterials.length > 0) {
                            resolve(aMaterials);
                        } else {
                            resolve();
                        }
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        }

    });
});