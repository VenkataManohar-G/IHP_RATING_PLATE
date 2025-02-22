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
    var addEntriesLength = 0, oBusyDialog, oAutoSearchDialog;
    var oAddEntryModel, omaterialsModel = new sap.ui.model.json.JSONModel(), oallmaterialsModel = new sap.ui.model.json.JSONModel(),ouserModel = new sap.ui.model.json.JSONModel();
    var i, oMatInput;
    var ValueState = coreLibrary.ValueState;
    return Controller.extend("rplabels.controller.rplabels_view", {
        onInit() {
            this._add_initial_entries();
        },
        onBeforeRendering(){
            var oModel = this.getOwnerComponent().getModel();
            this._getuserdetails(oModel);
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
        _getuserdetails: function (oModel) {
            oModel.read("/CurrentUser", {
                success: function (oData) {
                    var aUser = oData.results;
                    var that = this;
                    if (aUser.length > 0) {
                        ouserModel.setData(aUser);
                        that.getView().setModel(ouserModel);
                        that.getView().bindElement("/0");
                        console.log(aUser[0].jobname);
                    } else {
                    }
                }.bind(this),
                error: function (oError) {
                }.bind(this)
            });
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
            if (aTokens.length > 0) {
                var oFilter = [],
                    oPlantfilter;
                var oText = aTokens[0].getKey();
                var oselectedSet = aTokens[0].getAggregation("customData");
                var oselectedData = oselectedSet[0].getProperty("value");
                var oPlant = this.byId("id_plant");
                oPlant.setValue(oText);
                /*   oPlantfilter = new sap.ui.model.Filter("Plant", "EQ", oText);
                   oFilter.push(oPlantfilter)
                   let oMaterials = await that._getPlantmaterials(oModel, oFilter);
                   if (oMaterials) {
                       oallmaterialsModel.setData(oMaterials);
                       that.getView().setModel(oallmaterialsModel, "AllMaterials");
                       oBusyDialog.close();
                   } else {
                       oallmaterialsModel.setData(oMaterials);
                       oallmaterialsModel.refresh();
                       that.getView().setModel(oallmaterialsModel, "AllMaterials");
                       oBusyDialog.close();
                   } */
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
                oFilter = [],
                oPlantfilter,
                oValidatedPlant = oEvent.getSource(),
                sSelectedKey = oEvent.getParameter("newValue"),
                oModel = this.getView().getModel();
            oModel.setSizeLimit(999999);
            let oPlant = await that._plantValidation(oModel, sSelectedKey);
            if (sSelectedKey !== oPlant) {
                oValidatedPlant.setValueState(ValueState.Error);
                oValidatedPlant.setValueStateText("Please enter a valid Plant!");
            } else {
                oValidatedPlant.setValueState(ValueState.None);
                /* oPlantfilter = new sap.ui.model.Filter("Plant", "EQ", oPlant);
                 oFilter.push(oPlantfilter);
                 let oMaterials = await that._getPlantmaterials(oModel, oFilter);
                 if (oMaterials) {
                     oallmaterialsModel.setData(oMaterials);
                     that.getView().setModel(oallmaterialsModel, "AllMaterials");
                 } else {
                     oallmaterialsModel.setData(oMaterials);
                     oallmaterialsModel.refresh();
                     that.getView().setModel(oallmaterialsModel, "AllMaterials");
                 } */

            }
        },
        onMaterialliveChange: async function (oEvent) {
            var oModel = this.getView().getModel(),
                oPlant = this.getView().byId("id_plant").getValue(),
                sNewValue = oEvent.getParameter("value"),
                that = this,
                oFilter = [],
                oPlantfilter,
                oMaterialfilter;
            oMaterialfilter = new sap.ui.model.Filter({
                filters: [
                    new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, sNewValue),
                    new sap.ui.model.Filter("MaterialText", sap.ui.model.FilterOperator.Contains, sNewValue)
                ],
                and: false
            });
            oFilter.push(oMaterialfilter);
            oPlantfilter = new sap.ui.model.Filter("Plant", "EQ", oPlant);
            oFilter.push(oPlantfilter);
            let oMaterials = await that._getPlantmaterials(oModel, oFilter);
            if (oMaterials) {
                omaterialsModel.setData(oMaterials);
                that.getView().setModel(omaterialsModel, "Materials");
            } else {
                omaterialsModel.setData(oMaterials);
                omaterialsModel.refresh();
                that.getView().setModel(omaterialsModel, "Materials");
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
        _getPlantmaterials: function (oModel, filters) {
            return new Promise((resolve, reject) => {
                oModel.read("/Materials", {
                    filters: filters,
                    urlParameters: { "$top": 200 },
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
        },
        onMaterialVH: async function (oEvent) {
            oMatInput = oEvent.getSource();
            var sInputValue = oEvent.getSource().getValue(),
                oPlant = this.getView().byId("id_plant").getValue(),
                oView = this.getView(),
                oFilter = [],
                oPlantfilter,
                oModel = this.getView().getModel(),
                that = this;

            oPlantfilter = new sap.ui.model.Filter("Plant", "EQ", oPlant);
            oFilter.push(oPlantfilter);
            let oMaterials = await that._getPlantmaterials(oModel, oFilter);
            if (oMaterials) {
                oallmaterialsModel.setData(oMaterials);
                oallmaterialsModel.refresh();
                that.getView().setModel(oallmaterialsModel, "AllMaterials");
            } else {
                oallmaterialsModel.setData(oMaterials);
                oallmaterialsModel.refresh();
                that.getView().setModel(oallmaterialsModel, "AllMaterials");
            }
            if (!this._pValueHelpDialog) {
                this._pValueHelpDialog = Fragment.load({
                    id: oView.getId(),
                    name: "rplabels.view.MaterialVH",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pValueHelpDialog.then(function (oDialog) {
                // Create a filter for the binding
                if (sInputValue) {
                    oDialog.getBinding("items").filter([new Filter("Material", FilterOperator.Contains, sInputValue)]);
                    // Open ValueHelpDialog filtered by the input's value
                    oDialog.open(sInputValue);
                } else {
                    oDialog.open();
                }
            });
        },
        onValueHelpmaterialSearch: async function (oEvent) {
            var oFilter = [], oPlantfilter, oMaterialfilter,
                oPlant = this.getView().byId("id_plant").getValue(),
                oModel = this.getView().getModel(),
                sValue = oEvent.getParameter("value"),
                that = this;
            if (sValue) {
                oMaterialfilter = new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, sValue),
                        new sap.ui.model.Filter("MaterialText", sap.ui.model.FilterOperator.Contains, sValue)
                    ],
                    and: false
                });
                oFilter.push(oMaterialfilter);
            }
            oPlantfilter = new sap.ui.model.Filter("Plant", "EQ", oPlant);
            oFilter.push(oPlantfilter);
            let oMaterials = await that._getPlantmaterials(oModel, oFilter);
            if (oMaterials) {
                oallmaterialsModel.setData(oMaterials);
                oallmaterialsModel.refresh();
                that.getView().setModel(oallmaterialsModel, "AllMaterials");
            } else {
                oallmaterialsModel.setData(oMaterials);
                oallmaterialsModel.refresh();
                that.getView().setModel(oallmaterialsModel, "AllMaterials");
            }

        },
        onValueHelpmaterialClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var oValue = oSelectedItem.getDescription();
                oMatInput.setValue(oValue);
            }

        },
        onAddEntry: function (oEvent) {
            var that = this;
            var addDefaultEntry = {};
            oAddEntryModel = new sap.ui.model.json.JSONModel();
            i = i + 1;
            addDefaultEntry.Id = i;
            addDefaultEntry.Label = '';
            addDefaultEntry.Material = '';
            addDefaultEntries.push(addDefaultEntry);
            oAddEntryModel.setData(addDefaultEntries);
            that.getView().setModel(oAddEntryModel, "Entries");
            oAddEntryModel.refresh(true);
        },
        deleteRow: function (oEvent) {
            var that;
            that = this;
            var getRemoveIndex = oEvent.getParameter("listItem");
            var oCells = getRemoveIndex.getCells();
            var sId = oCells[0].getValue();
            var iId = sId * 1;
            oAddEntryModel = new sap.ui.model.json.JSONModel();
            const index = addDefaultEntries.findIndex((obj) => (obj.Id) === iId);
            if (index !== -1) {
                addDefaultEntries.splice(index, 1);
                oAddEntryModel.setData(addDefaultEntries);
                that.getView().setModel(oAddEntryModel, "Entries");
                oAddEntryModel.refresh(true);
            }
            var oTable = this.getView().byId("tableId1");
            oTable.removeItem(oEvent.getParameter("listItem"));
        }

    });
});