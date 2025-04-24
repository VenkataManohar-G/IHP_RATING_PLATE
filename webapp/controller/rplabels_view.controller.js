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
    "sap/ui/core/message/Message",
    "sap/m/MessageBox"
], (Controller, coreLibrary, exportLibrary, Spreadsheet, Dialog, mobileLibrary, Button, Text, Sorter, Filter,
    SearchField, UIColumn, MColumn, Label, TypeString, compLibrary, FilterOperator, Fragment, Message, MessageBox) => {
    "use strict";
    var addDefaultEntries = [];
    var addEntriesLength = 0, oBusyDialog, oAutoSearchDialog;
    var oAddEntryModel = new sap.ui.model.json.JSONModel(), omaterialsModel = new sap.ui.model.json.JSONModel(), oallmaterialsModel = new sap.ui.model.json.JSONModel(), ouserModel = new sap.ui.model.json.JSONModel(), oprinterModel = new sap.ui.model.json.JSONModel(), materialLogs = [];
    var i, oMatInput, oExecuteBusyModel, oFieldModel;
    var ValueState = coreLibrary.ValueState;
    var sUrl, sToken;
    //= "https://labelcloudapi.onnicelabel.com/Trigger/v1/CloudTrigger/Api-CloudIntegrationDemo-Print"
    //"https://labelcloudapi.onnicelabel.com/Trigger/v1/CloudTrigger/Api-CloudIntegrationDemo-Print";
    return Controller.extend("rplabels.controller.rplabels_view", {
        onInit() {
            var that = this;
            this._add_initial_entries();

            oFieldModel = new sap.ui.model.json.JSONModel({
                bHideColumn: false
            });
            that.getView().setModel(oFieldModel, "FieldProperty");
        },
        onBeforeRendering() {
            var oModel = this.getOwnerComponent().getModel();
            this._getuserdetails(oModel);
        },
        _add_initial_entries: function () {
            var that = this;
            addDefaultEntries = [];
            for (i = 0; i <= 9; i++) {
                var addDefaultEntry = {};
                addDefaultEntry.Id = i;
                addDefaultEntry.Label = '';
                addDefaultEntry.Material = '';
                addDefaultEntry.Message = ''
                addDefaultEntry.Status = ''
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
                        that.getView().byId("id_job").setValue(aUser[0].jobname);
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
            if (oPlant) {
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
            } else {
                MessageBox.warning("Plant is Mandatory");
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
                    //oDialog.getBinding("items").filter([new Filter("Material", FilterOperator.Contains, sInputValue)]);
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
            i = i + 1;
            addDefaultEntry.Id = i;
            addDefaultEntry.Label = '';
            addDefaultEntry.Material = '';
            addDefaultEntry.Message = ''
            addDefaultEntry.Status = ''
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
            const index = addDefaultEntries.findIndex((obj) => (obj.Id) === iId);
            if (index !== -1) {
                addDefaultEntries.splice(index, 1);
                oAddEntryModel.setData(addDefaultEntries);
                that.getView().setModel(oAddEntryModel, "Entries");
                oAddEntryModel.refresh(true);
            }
            var oTable = this.getView().byId("tableId1");
            oTable.removeItem(oEvent.getParameter("listItem"));
        },
        onExecute: async function (oEvent) {
            materialLogs = [];
            var oListData = [], oFilter = [], filterMaterial, filterPlant;
            var RecordTable = this.getView().byId("tableId1");
            var newEntries = RecordTable.getBinding("items");
            var oPlant = this.getView().byId("id_plant").getValue();
            var oPrinter = this.getView().byId("id_printer").getValue();
            var that = this, oModel = this.getView().getModel();
            var oConfigDataModel = this.getOwnerComponent().getModel('configurationModel');
            var oConfigData = oConfigDataModel.getData().items;
            var oFieldDataModel = this.getOwnerComponent().getModel('fieldMappingModel');
            var oFieldData = oFieldDataModel.getData().items;
            try {
                if (oConfigData.length > 0) {
                    let urldetails = oConfigData.filter(function (item) {
                        return item.fieldname === 'URL';
                    });
                    if (urldetails.length > 0) {
                        sUrl = urldetails[0].value;
                    }
                    let tokendetails = oConfigData.filter(function (item) {
                        return item.fieldname === 'TOKEN';
                    });
                    if (tokendetails.length > 0) {
                        sToken = tokendetails[0].value;
                    }
                }
            } catch (error) {
                sToken = '';
                sUrl = '';
            }
            if (sUrl && sToken) {
                oListData = newEntries.oList;

                oExecuteBusyModel = new sap.m.BusyDialog({
                    title: "Loading Data",
                    text: "Please wait....."
                });
                oExecuteBusyModel.open();
                console.log(oListData);
                oListData.forEach(function (oItem, Index) {
                    console.log(oItem.Material);
                    if (oItem.Material) {
                        filterMaterial = new sap.ui.model.Filter({
                            filters: [
                                new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, oItem.Material)
                            ],
                            and: false
                        });
                        oFilter.push(filterMaterial);
                    }
                });
                filterPlant = new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, oPlant);
                oFilter.push(filterPlant);
                console.log(oFilter);
                try {
                    var oMaterialData = await that._getmaterialDetails(oModel, oFilter);
                    if (oMaterialData) {
                        var oLoftware = {};
                        oLoftware.Variables = [];
                        oLoftware.FileVersion = "";
                        oLoftware.PrinterSettings = "";
                        for (var Material of oMaterialData) {
                            try {
                                if (Material) {
                                    var Variables = {};
                                    var urllabel = Material.labelName;
                                    if (urllabel) {
                                        Variables.FilePath = urllabel;
                                    }
                                    let tabledata = oListData.filter(function (item) {
                                        return item.Material === Material.Material;
                                    });
                                    if (tabledata.length > 0) {
                                        Variables.Quantity = tabledata[0].Label;
                                    } else {
                                        Variables.Quantity = "1";
                                    }
                                    if (oPrinter) {
                                        Variables.Printer = oPrinter;
                                    }
                                    if (Material.Material) {
                                        var loftwarematerialfield;
                                        try {
                                            let materialfield = oFieldData.filter(function (item) {
                                                return item.sapfield === 'Material';
                                            });
                                            loftwarematerialfield = materialfield[0].loftwarefield;
                                        } catch (error) {
                                            loftwarematerialfield = '';
                                        }
                                        if (loftwarematerialfield) { Variables[loftwarematerialfield] = Material.Material; }
                                    }
                                    if (Material.insepectionMemo) {
                                        var loftwareMemofield;
                                        try {
                                            let Memofield = oFieldData.filter(function (item) {
                                                return item.sapfield === 'insepectionMemo';
                                            });
                                            loftwareMemofield = Memofield[0].loftwarefield;
                                        } catch (error) {
                                            loftwareMemofield = '';
                                        }
                                        if (loftwareMemofield) { Variables[loftwareMemofield] = Material.insepectionMemo; }
                                    }
                                    if (Material.quantity_GRGI) {
                                        var loftwareGRquant;
                                        try {
                                            let GRQuantfield = oFieldData.filter(function (item) {
                                                return item.sapfield === 'quantity_GRGI';
                                            });
                                            loftwareGRquant = GRQuantfield[0].loftwarefield;
                                        } catch (error) {
                                            loftwareGRquant = '';
                                        }
                                        if (loftwareGRquant) { Variables[loftwareGRquant] = Material.quantity_GRGI; }
                                    }
                                    if (Material.labelFrom) {
                                        var loftwarelabelFrom;
                                        try {
                                            let LabelFromfield = oFieldData.filter(function (item) {
                                                return item.sapfield === 'labelFrom';
                                            });
                                            loftwarelabelFrom = LabelFromfield[0].loftwarefield;
                                        } catch (error) {
                                            loftwarelabelFrom = '';
                                        }
                                        if (loftwarelabelFrom) { Variables[loftwarelabelFrom] = Material.labelFrom; }
                                    }
                                    if (Material.labelType) {
                                        var loftwarelabelType;
                                        try {
                                            let LabelTypefield = oFieldData.filter(function (item) {
                                                return item.sapfield === 'labelType';
                                            });
                                            loftwarelabelType = LabelTypefield[0].loftwarefield;
                                        } catch (error) {
                                            loftwarelabelType = '';
                                        }
                                        if (loftwarelabelType) { Variables[loftwarelabelType] = Material.labelType; }
                                    }
                                    if (Material.materialOld) {
                                        var loftwarematerialOld;
                                        try {
                                            let materialOldfield = oFieldData.filter(function (item) {
                                                return item.sapfield === 'materialOld';
                                            });
                                            loftwarematerialOld = materialOldfield[0].loftwarefield;
                                        } catch (error) {
                                            loftwarematerialOld = '';
                                        }
                                        if (loftwarematerialOld) { Variables[loftwarematerialOld] = Material.materialOld; }
                                    }
                                    if (Material.articleNo_EAN_UPC) {
                                        var loftwarearticleNo;
                                        try {
                                            let articleNofield = oFieldData.filter(function (item) {
                                                return item.sapfield === 'articleNo_EAN_UPC';
                                            });
                                            loftwarearticleNo = articleNofield[0].loftwarefield;
                                        } catch (error) {
                                            loftwarearticleNo = '';
                                        }
                                        if (loftwarearticleNo) { Variables[loftwarearticleNo] = Material.articleNo_EAN_UPC; }
                                    }
                                    if (Material.materialGroup) {
                                        var loftwarematerialGroup;
                                        try {
                                            let materialGroupfield = oFieldData.filter(function (item) {
                                                return item.sapfield === 'materialGroup';
                                            });
                                            loftwarematerialGroup = materialGroupfield[0].loftwarefield;
                                        } catch (error) {
                                            loftwarematerialGroup = '';
                                        }
                                        if (loftwarematerialGroup) { Variables[loftwarematerialGroup] = Material.materialGroup; }
                                    }
                                    if (Material.materialDescription) {
                                        var loftwarematerialDescription;
                                        try {
                                            let materialDescfield = oFieldData.filter(function (item) {
                                                return item.sapfield === 'materialDescription';
                                            });
                                            loftwarematerialDescription = materialDescfield[0].loftwarefield;
                                        } catch (error) {
                                            loftwarematerialDescription = '';
                                        }
                                        if (loftwarematerialDescription) { Variables[loftwarematerialDescription] = Material.materialDescription; }
                                    }
                                    if (Material.serialNo) {
                                        var loftwareserialNo;
                                        try {
                                            let serialNofield = oFieldData.filter(function (item) {
                                                return item.sapfield === 'serialNo';
                                            });
                                            loftwareserialNo = serialNofield[0].loftwarefield;
                                        } catch (error) {
                                            loftwareserialNo = '';
                                        }
                                        if (loftwareserialNo) { Variables[loftwareserialNo] = Material.serialNo; }
                                    }
                                    if (Material.materialSubstitute) {
                                        var loftwarematerialSubstitute;
                                        try {
                                            let loftwarematerialSubfield = oFieldData.filter(function (item) {
                                                return item.sapfield === 'materialSubstitute';
                                            });
                                            loftwarematerialSubstitute = loftwarematerialSubfield[0].loftwarefield;
                                        } catch (error) {
                                            loftwarematerialSubstitute = '';
                                        }
                                        if (loftwarematerialSubstitute) { Variables[loftwarematerialSubstitute] = Material.materialSubstitute; }
                                    }
                                    if (Material.userText) {
                                        var loftwaretext;
                                        try {
                                            let loftwaretextfield = oFieldData.filter(function (item) {
                                                return item.sapfield === 'userText';
                                            });
                                            loftwaretext = loftwaretextfield[0].loftwarefield;
                                        } catch (error) {
                                            loftwaretext = '';
                                        }
                                        if (loftwaretext) { Variables[loftwaretext] = Material.userText; }
                                    }
                                    if (Material.location) {
                                        var loftwarelocation;
                                        try {
                                            let loftwarelocationfield = oFieldData.filter(function (item) {
                                                return item.sapfield === 'location';
                                            });
                                            loftwarelocation = loftwarelocationfield[0].loftwarefield;
                                        } catch (error) {
                                            loftwarelocation = '';
                                        }
                                        if (loftwarelocation) { Variables[loftwarelocation] = Material.location; } 
                                    }
                                    if (Material.rp001) {
                                        var loftwarerp001;
                                        try {
                                            let rp001field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP001';
                                            });
                                            loftwarerp001 = rp001field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp001 = '';
                                        }
                                        if (loftwarerp001) { Variables[loftwarerp001] = Material.rp001; }
                                    }
                                    if (Material.rp002) {
                                        var loftwarerp002;
                                        try {
                                            let rp002field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP002';
                                            });
                                            loftwarerp002 = rp002field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp002 = '';
                                        }
                                        if (loftwarerp002) { Variables[loftwarerp002] = Material.rp002; }
                                    }
                                    if (Material.rp003) {
                                        var loftwarerp003;
                                        try {
                                            let rp003field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP003';
                                            });
                                            loftwarerp003 = rp003field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp003 = '';
                                        }
                                        if (loftwarerp003) { Variables[loftwarerp003] = Material.rp003; }
                                    }
                                    if (Material.rp004) {
                                        var loftwarerp004;
                                        try {
                                            let rp004field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP004';
                                            });
                                            loftwarerp004 = rp004field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp004 = '';
                                        }
                                        if (loftwarerp004) { Variables[loftwarerp004] = Material.rp004; }
                                    }
                                    if (Material.rp005) {
                                        var loftwarerp005;
                                        try {
                                            let rp005field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP005';
                                            });
                                            loftwarerp005 = rp005field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp005 = '';
                                        }
                                        if (loftwarerp005) { Variables[loftwarerp005] = Material.rp005; }
                                    }
                                    if (Material.rp006) {
                                        var loftwarerp006;
                                        try {
                                            let rp006field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP006';
                                            });
                                            loftwarerp006 = rp006field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp006 = '';
                                        }
                                        if (loftwarerp006) { Variables[loftwarerp006] = Material.rp006; }
                                    }
                                    if (Material.rp007) {
                                        var loftwarerp007;
                                        try {
                                            let rp007field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP007';
                                            });
                                            loftwarerp007 = rp007field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp007 = '';
                                        }
                                        if (loftwarerp007) { Variables[loftwarerp007] = Material.rp007; }
                                    }
                                    if (Material.rp008) {
                                        var loftwarerp008;
                                        try {
                                            let rp008field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP008';
                                            });
                                            loftwarerp008 = rp008field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp008 = '';
                                        }
                                        if (loftwarerp008) { Variables[loftwarerp008] = Material.rp008; }
                                    }
                                    if (Material.rp009) {
                                        var loftwarerp009;
                                        try {
                                            let rp009field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP009';
                                            });
                                            loftwarerp009 = rp009field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp009 = '';
                                        }
                                        if (loftwarerp009) { Variables[loftwarerp009] = Material.rp009; }
                                    }
                                    if (Material.rp010) {
                                        var loftwarerp010;
                                        try {
                                            let rp010field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP010';
                                            });
                                            loftwarerp010 = rp010field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp010 = '';
                                        }
                                        if (loftwarerp010) { Variables[loftwarerp010] = Material.rp010; }
                                    }
                                    if (Material.rp011) {
                                        var loftwarerp011;
                                        try {
                                            let rp011field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP011';
                                            });
                                            loftwarerp011 = rp011field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp011 = '';
                                        }
                                        if (loftwarerp011) { Variables[loftwarerp011] = Material.rp011; }
                                    }
                                    if (Material.rp012) {
                                        var loftwarerp012;
                                        try {
                                            let rp012field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP012';
                                            });
                                            loftwarerp012 = rp012field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp012 = '';
                                        }
                                        if (loftwarerp012) { Variables[loftwarerp012] = Material.rp012; }
                                    }
                                    if (Material.rp013) {
                                        var loftwarerp013;
                                        try {
                                            let rp013field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP013';
                                            });
                                            loftwarerp013 = rp013field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp013 = '';
                                        }
                                        if (loftwarerp013) { Variables[loftwarerp013] = Material.rp013; }
                                    }
                                    if (Material.rp014) {
                                        var loftwarerp014;
                                        try {
                                            let rp014field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP014';
                                            });
                                            loftwarerp014 = rp014field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp014 = '';
                                        }
                                        if (loftwarerp014) { Variables[loftwarerp014] = Material.rp014; }
                                    }
                                    if (Material.rp015) {
                                        var loftwarerp015;
                                        try {
                                            let rp015field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP015';
                                            });
                                            loftwarerp015 = rp015field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp015 = '';
                                        }
                                        if (loftwarerp015) { Variables[loftwarerp015] = Material.rp015; }
                                    }
                                    if (Material.rp016) {
                                        var loftwarerp016;
                                        try {
                                            let rp016field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP016';
                                            });
                                            loftwarerp016 = rp016field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp016 = '';
                                        }
                                        if (loftwarerp016) { Variables[loftwarerp016] = Material.rp016; }
                                    }
                                    if (Material.rp017) {
                                        var loftwarerp017;
                                        try {
                                            let rp017field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP017';
                                            });
                                            loftwarerp017 = rp017field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp017 = '';
                                        }
                                        if (loftwarerp017) { Variables[loftwarerp017] = Material.rp017; }
                                    }
                                    if (Material.rp018) {
                                        var loftwarerp018;
                                        try {
                                            let rp018field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP018';
                                            });
                                            loftwarerp018 = rp018field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp018 = '';
                                        }
                                        if (loftwarerp018) { Variables[loftwarerp018] = Material.rp018; }
                                    }
                                    if (Material.rp019) {
                                        var loftwarerp019;
                                        try {
                                            let rp019field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP019';
                                            });
                                            loftwarerp019 = rp019field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp019 = '';
                                        }
                                        if (loftwarerp019) { Variables[loftwarerp019] = Material.rp019; }
                                    }
                                    if (Material.rp020) {
                                        var loftwarerp020;
                                        try {
                                            let rp020field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP020';
                                            });
                                            loftwarerp020 = rp020field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp020 = '';
                                        }
                                        if (loftwarerp020) { Variables[loftwarerp020] = Material.rp020; }
                                    }
                                    if (Material.rp021) {
                                        var loftwarerp021;
                                        try {
                                            let rp021field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP021';
                                            });
                                            loftwarerp021 = rp021field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp021 = '';
                                        }
                                        if (loftwarerp021) { Variables[loftwarerp021] = Material.rp021; }
                                    }
                                    if (Material.rp022) {
                                        var loftwarerp022;
                                        try {
                                            let rp022field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP022';
                                            });
                                            loftwarerp022 = rp022field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp022 = '';
                                        }
                                        if (loftwarerp022) { Variables[loftwarerp022] = Material.rp022; }
                                    }
                                    if (Material.rp023) {
                                        var loftwarerp023;
                                        try {
                                            let rp023field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP023';
                                            });
                                            loftwarerp023 = rp023field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp023 = '';
                                        }
                                        if (loftwarerp023) { Variables[loftwarerp023] = Material.rp023; }
                                    }
                                    if (Material.rp024) {
                                        var loftwarerp024;
                                        try {
                                            let rp024field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP024';
                                            });
                                            loftwarerp024 = rp024field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp024 = '';
                                        }
                                        if (loftwarerp024) { Variables[loftwarerp024] = Material.rp024; }
                                    }
                                    if (Material.rp025) {
                                        var loftwarerp025;
                                        try {
                                            let rp025field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP025';
                                            });
                                            loftwarerp025 = rp025field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp025 = '';
                                        }
                                        if (loftwarerp025) { Variables[loftwarerp025] = Material.rp025; }
                                    }
                                    if (Material.rp026) {
                                        var loftwarerp026;
                                        try {
                                            let rp026field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP026';
                                            });
                                            loftwarerp026 = rp026field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp026 = '';
                                        }
                                        if (loftwarerp026) { Variables[loftwarerp026] = Material.rp026; }
                                    }
                                    if (Material.rp027) {
                                        var loftwarerp027;
                                        try {
                                            let rp027field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP027';
                                            });
                                            loftwarerp027 = rp027field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp027 = '';
                                        }
                                        if (loftwarerp027) { Variables[loftwarerp027] = Material.rp027; }
                                    }
                                    if (Material.rp028) {
                                        var loftwarerp028;
                                        try {
                                            let rp028field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP028';
                                            });
                                            loftwarerp028 = rp028field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp028 = '';
                                        }
                                        if (loftwarerp028) { Variables[loftwarerp028] = Material.rp028; }
                                    }
                                    if (Material.rp029) {
                                        var loftwarerp029;
                                        try {
                                            let rp029field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP029';
                                            });
                                            loftwarerp029 = rp029field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp029 = '';
                                        }
                                        if (loftwarerp029) { Variables[loftwarerp029] = Material.rp029; }
                                    }
                                    if (Material.rp030) {
                                        var loftwarerp030;
                                        try {
                                            let rp030field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP030';
                                            });
                                            loftwarerp030 = rp030field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp030 = '';
                                        }
                                        if (loftwarerp030) { Variables[loftwarerp030] = Material.rp030; }
                                    }
                                    if (Material.rp031) {
                                        var loftwarerp031;
                                        try {
                                            let rp031field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP031';
                                            });
                                            loftwarerp031 = rp031field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp031 = '';
                                        }
                                        if (loftwarerp031) { Variables[loftwarerp031] = Material.rp031; }
                                    }
                                    if (Material.rp032) {
                                        var loftwarerp032;
                                        try {
                                            let rp032field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP032';
                                            });
                                            loftwarerp032 = rp032field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp032 = '';
                                        }
                                        if (loftwarerp032) { Variables[loftwarerp032] = Material.rp032; }
                                    }
                                    if (Material.rp033) {
                                        var loftwarerp033;
                                        try {
                                            let rp033field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP033';
                                            });
                                            loftwarerp033 = rp033field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp033 = '';
                                        }
                                        if (loftwarerp033) { Variables[loftwarerp033] = Material.rp033; }
                                    }
                                    if (Material.rp034) {
                                        var loftwarerp034;
                                        try {
                                            let rp034field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP034';
                                            });
                                            loftwarerp034 = rp034field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp034 = '';
                                        }
                                        if (loftwarerp034) { Variables[loftwarerp034] = Material.rp034; }
                                    }
                                    if (Material.rp035) {
                                        var loftwarerp035;
                                        try {
                                            let rp035field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP035';
                                            });
                                            loftwarerp035 = rp035field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp035 = '';
                                        }
                                        if (loftwarerp035) { Variables[loftwarerp035] = Material.rp035; }
                                    }
                                    if (Material.rp036) {
                                        var loftwarerp036;
                                        try {
                                            let rp036field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP036';
                                            });
                                            loftwarerp036 = rp036field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp036 = '';
                                        }
                                        if (loftwarerp036) { Variables[loftwarerp036] = Material.rp036; }
                                    }
                                    if (Material.rp037) {
                                        var loftwarerp037;
                                        try {
                                            let rp037field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP037';
                                            });
                                            loftwarerp037 = rp037field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp037 = '';
                                        }
                                        if (loftwarerp037) { Variables[loftwarerp037] = Material.rp037; }
                                    }
                                    if (Material.rp038) {
                                        var loftwarerp038;
                                        try {
                                            let rp038field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP038';
                                            });
                                            loftwarerp038 = rp038field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp038 = '';
                                        }
                                        if (loftwarerp038) { Variables[loftwarerp038] = Material.rp038; }
                                    }
                                    if (Material.rp039) {
                                        var loftwarerp039;
                                        try {
                                            let rp039field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP039';
                                            });
                                            loftwarerp039 = rp039field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp039 = '';
                                        }
                                        if (loftwarerp039) { Variables[loftwarerp039] = Material.rp039; }
                                    }
                                    if (Material.rp040) {
                                        var loftwarerp040;
                                        try {
                                            let rp040field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP040';
                                            });
                                            loftwarerp040 = rp040field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp040 = '';
                                        }
                                        if (loftwarerp040) { Variables[loftwarerp040] = Material.rp040; }
                                    }
                                    if (Material.rp041) {
                                        var loftwarerp041;
                                        try {
                                            let rp041field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP041';
                                            });
                                            loftwarerp041 = rp041field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp041 = '';
                                        }
                                        if (loftwarerp041) { Variables[loftwarerp041] = Material.rp041; }
                                    }
                                    if (Material.rp042) {
                                        var loftwarerp042;
                                        try {
                                            let rp042field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP042';
                                            });
                                            loftwarerp042 = rp042field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp042 = '';
                                        }
                                        if (loftwarerp042) { Variables[loftwarerp042] = Material.rp042; }
                                    }
                                    if (Material.rp043) {
                                        var loftwarerp043;
                                        try {
                                            let rp043field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP043';
                                            });
                                            loftwarerp043 = rp043field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp043 = '';
                                        }
                                        if (loftwarerp043) { Variables[loftwarerp043] = Material.rp043; }
                                    }
                                    if (Material.rp044) {
                                        var loftwarerp044;
                                        try {
                                            let rp044field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP044';
                                            });
                                            loftwarerp044 = rp044field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp044 = '';
                                        }
                                        if (loftwarerp044) { Variables[loftwarerp044] = Material.rp044; }
                                    }
                                    if (Material.rp045) {
                                        var loftwarerp045;
                                        try {
                                            let rp045field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP045';
                                            });
                                            loftwarerp045 = rp045field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp045 = '';
                                        }
                                        if (loftwarerp045) { Variables[loftwarerp045] = Material.rp045; }
                                    }
                                    if (Material.rp046) {
                                        var loftwarerp046;
                                        try {
                                            let rp046field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP046';
                                            });
                                            loftwarerp046 = rp046field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp046 = '';
                                        }
                                        if (loftwarerp046) { Variables[loftwarerp046] = Material.rp046; }
                                    }
                                    if (Material.rp047) {
                                        var loftwarerp047;
                                        try {
                                            let rp047field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP047';
                                            });
                                            loftwarerp047 = rp047field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp047 = '';
                                        }
                                        if (loftwarerp047) { Variables[loftwarerp047] = Material.rp047; }
                                    }
                                    if (Material.rp048) {
                                        var loftwarerp048;
                                        try {
                                            let rp048field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP048';
                                            });
                                            loftwarerp048 = rp048field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp048 = '';
                                        }
                                        if (loftwarerp048) { Variables[loftwarerp048] = Material.rp048; }
                                    }
                                    if (Material.rp049) {
                                        var loftwarerp049;
                                        try {
                                            let rp049field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP049';
                                            });
                                            loftwarerp049 = rp049field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp049 = '';
                                        }
                                        if (loftwarerp049) { Variables[loftwarerp049] = Material.rp049; }
                                    }
                                    if (Material.rp050) {
                                        var loftwarerp050;
                                        try {
                                            let rp050field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP050';
                                            });
                                            loftwarerp050 = rp050field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp050 = '';
                                        }
                                        if (loftwarerp050) { Variables[loftwarerp050] = Material.rp050; }
                                    }
                                    if (Material.rp051) {
                                        var loftwarerp051;
                                        try {
                                            let rp051field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP051';
                                            });
                                            loftwarerp051 = rp051field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp051 = '';
                                        }
                                        if (loftwarerp051) { Variables[loftwarerp051] = Material.rp051; }
                                    }
                                    if (Material.rp052) {
                                        var loftwarerp052;
                                        try {
                                            let rp052field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP052';
                                            });
                                            loftwarerp052 = rp052field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp052 = '';
                                        }
                                        if (loftwarerp052) { Variables[loftwarerp052] = Material.rp052; }
                                    }
                                    if (Material.rp053) {
                                        var loftwarerp053;
                                        try {
                                            let rp053field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP053';
                                            });
                                            loftwarerp053 = rp053field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp053 = '';
                                        }
                                        if (loftwarerp053) { Variables[loftwarerp053] = Material.rp053; }
                                    }
                                    if (Material.rp054) {
                                        var loftwarerp054;
                                        try {
                                            let rp054field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP054';
                                            });
                                            loftwarerp054 = rp054field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp054 = '';
                                        }
                                        if (loftwarerp054) { Variables[loftwarerp054] = Material.rp054; }
                                    }
                                    if (Material.rp055) {
                                        var loftwarerp055;
                                        try {
                                            let rp055field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP055';
                                            });
                                            loftwarerp055 = rp055field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp055 = '';
                                        }
                                        if (loftwarerp055) { Variables[loftwarerp055] = Material.rp055; }
                                    }
                                    if (Material.rp056) {
                                        var loftwarerp056;
                                        try {
                                            let rp056field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP056';
                                            });
                                            loftwarerp056 = rp056field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp056 = '';
                                        }
                                        if (loftwarerp056) { Variables[loftwarerp056] = Material.rp056; }
                                    }
                                    if (Material.rp057) {
                                        var loftwarerp057;
                                        try {
                                            let rp057field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP057';
                                            });
                                            loftwarerp057 = rp057field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp057 = '';
                                        }
                                        if (loftwarerp057) { Variables[loftwarerp057] = Material.rp057; }
                                    }
                                    if (Material.rp058) {
                                        var loftwarerp058;
                                        try {
                                            let rp058field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP058';
                                            });
                                            loftwarerp058 = rp058field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp058 = '';
                                        }
                                        if (loftwarerp058) { Variables[loftwarerp058] = Material.rp058; }
                                    }
                                    if (Material.rp059) {
                                        var loftwarerp059;
                                        try {
                                            let rp059field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP059';
                                            });
                                            loftwarerp059 = rp059field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp059 = '';
                                        }
                                        if (loftwarerp059) { Variables[loftwarerp059] = Material.rp059; }
                                    }
                                    if (Material.rp060) {
                                        var loftwarerp060;
                                        try {
                                            let rp060field = oFieldData.filter(function (item) {
                                                return item.sapfield === 'RP060';
                                            });
                                            loftwarerp060 = rp060field[0].loftwarefield;
                                        } catch (error) {
                                            loftwarerp060 = '';
                                        }
                                        if (loftwarerp060) { Variables[loftwarerp060] = Material.rp060; }
                                    }
                                    oLoftware.Variables.push(Variables);

                                }
                            } catch (error) {
                                oExecuteBusyModel.close();
                                MessageBox.error("No Materials Data found to print labels");
                            }
                        };
                        if (oLoftware.Variables.length > 0) {
                            var oLoftwareJson = JSON.stringify(oLoftware);
                            try {
                                var oResult = await that._sendcrlabels(sUrl, oLoftwareJson);
                            } catch (error) {
                            }
                            if (materialLogs) {
                                var oModel = this.getView().getModel("Entries");
                                var oData = oModel.getData();
                                console.log(oData);
                                for (var i = 0; i < oData.length; i++) {
                                    if (oData[i].Label && oData[i].Material) {
                                        let existingMaterialData = oMaterialData.filter(function (item) {
                                            return item.Material === oData[i].Material;
                                        });
                                        console.log(existingMaterialData);
                                        if (existingMaterialData.length > 0) {
                                            oData[i].Status = materialLogs[0].Status;
                                            oData[i].Message = materialLogs[0].Message;
                                        } else {
                                            oData[i].Status = 'E';
                                            oData[i].Message = 'Material Characteristics Not Found';
                                        }

                                    }
                                }
                                oModel.refresh();
                                oFieldModel = this.getView().getModel("FieldProperty");
                                oFieldModel.setProperty("/bHideColumn", true);
                                oFieldModel.refresh();
                            }
                            oExecuteBusyModel.close();
                        } else {
                            MessageBox.error("No Materials Characteristics found to print labels");
                            oExecuteBusyModel.close();
                        }

                    } else {
                        oExecuteBusyModel.close();
                        MessageBox.error("No Materials Data found to print labels");
                    }
                } catch (error) {
                    MessageBox.warning("No Materials Characteristics Found!! Please try again");
                    oExecuteBusyModel.close();
                }
            } else {
                MessageBox.warning("No Loftware Configurations maintaned!! Please Configure");
            }
        },
        _getmaterialDetails: async function (oModel, oFilter) {
            return new Promise((resolve, reject) => {
                oModel.read("/MaterialsData", {
                    filters: oFilter,
                    urlParameters: { "$top": 2000 },
                    success: function (oData) {
                        var aMaterialsData = oData.results;
                        if (aMaterialsData.length > 0) {
                            resolve(aMaterialsData);
                        } else {
                            resolve("404");
                        }
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },
        _sendcrlabels: async function (sUrl, oLoftwareJson) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    type: "POST",
                    url: sUrl,
                    dataType: "json",
                    contentType: "application/json",
                    data: oLoftwareJson,
                    crossDomain: true,
                    headers: {
                        "Ocp-Apim-Subscription-Key": sToken
                    },
                    success: function (response) {
                        console.log("Success:", response);
                        resolve({ status: 'S', Message: 'Successfully' });
                        if (response) {
                            var sResponse = response.Response;
                        }
                        materialLogs.push({ Status: 'S', Message: sResponse })
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        console.log("Error:", xhr);
                        reject({ status: 'E', Message: xhr.responseText });
                        try {
                            var message = JSON.parse(xhr.responseText);
                            var sMessage = message.Message;
                        } catch (error) {
                            var message = xhr.responseText;
                            var sMessage = message
                        }

                        if (sMessage) {
                            var aMessage = sMessage;
                        }
                        materialLogs.push({ Status: 'E', Message: aMessage })
                    }
                });
            })
        },
        onReset: function () {
            var that = this;
            addDefaultEntries = [];
            for (i = 0; i <= 9; i++) {
                var addDefaultEntry = {};
                addDefaultEntry.Id = i;
                addDefaultEntry.Label = '';
                addDefaultEntry.Material = '';
                addDefaultEntry.Message = ''
                addDefaultEntry.Status = ''
                addDefaultEntries.push(addDefaultEntry);
            }
            oAddEntryModel.setData(addDefaultEntries);
            that.getView().setModel(oAddEntryModel, "Entries");
            oAddEntryModel.refresh(true);

            oFieldModel = this.getView().getModel("FieldProperty");
            oFieldModel.setProperty("/bHideColumn", false);
            oFieldModel.refresh();
        },
        onExit: function () {
            this.getView().byId("id_txt_mat").destroy();
            this.getView().byId("id_txt_mattext").destroy();
            this.getView().byId("id_collist_mat").destroy();

            oFieldModel = this.getView().getModel("FieldProperty");
            oFieldModel.setProperty("/bHideColumn", false);
            oFieldModel.refresh();

        },
        _getPlantprinter: function (oModel, oFilter) {
            return new Promise((resolve, reject) => {
                oModel.read("/Printers", {
                    filters: oFilter,
                    urlParameters: { "$top": 500 },
                    success: function (oData) {
                        var aPrinters = oData.results;
                        if (aPrinters.length > 0) {
                            resolve(aPrinters);
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
        onPrinterVH: async function (oEvent) {
            var sInputValue = oEvent.getSource().getValue(),
                oView = this.getView(),
                oPlantfilter,
                oModel = this.getView().getModel(),
                that = this;
            let oPrinters = await that._getPlantprinter(oModel);
            if (oPrinters) {
                oprinterModel.setData(oPrinters);
                oprinterModel.refresh();
                that.getView().setModel(oprinterModel, "Printers");
            } else {
                oprinterModel.setData(oPrinters);
                oprinterModel.refresh();
                that.getView().setModel(oprinterModel, "Printers");
            }
            if (!this._pValueHelpDialogPrinter) {
                this._pValueHelpDialogPrinter = Fragment.load({
                    id: oView.getId(),
                    name: "rplabels.view.PrintersVH",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pValueHelpDialogPrinter.then(function (oDialog) {
                // Create a filter for the binding
                if (sInputValue) {
                    oDialog.open(sInputValue);
                } else {
                    oDialog.open();
                }
            });

        },
        onValueHelpprinterSearch: async function (oEvent) {
            var oFilter = [], oPrinterfilter,
                oModel = this.getView().getModel(),
                sValue = oEvent.getParameter("value"),
                that = this;
            if (sValue) {
                oPrinterfilter = new sap.ui.model.Filter("Printer", sap.ui.model.FilterOperator.Contains, sValue);
                oFilter.push(oPrinterfilter);
            }
            let oPrinter = await that._getPlantprinter(oModel, oFilter);
            if (oPrinter) {
                oprinterModel.setData(oPrinter);
                oprinterModel.refresh();
                that.getView().setModel(oprinterModel, "Printers");
            } else {
                oprinterModel.setData(oPrinter);
                oprinterModel.refresh();
                that.getView().setModel(oprinterModel, "Printers");
            }

        },
        onValueHelpprinterClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var sPrinter = this.getView().byId('id_printer');
            if (oSelectedItem) {
                var oValue = oSelectedItem.getTitle();
                sPrinter.setValue(oValue);

            }

        }

    });
});