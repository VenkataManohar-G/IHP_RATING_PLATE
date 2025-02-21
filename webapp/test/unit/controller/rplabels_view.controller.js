/*global QUnit*/

sap.ui.define([
	"rplabels/controller/rplabels_view.controller"
], function (Controller) {
	"use strict";

	QUnit.module("rplabels_view Controller");

	QUnit.test("I should test the rplabels_view controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
