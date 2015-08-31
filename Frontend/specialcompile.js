addAdvancedInput()
$("#selectinputtype").on("change", function () {
	if($( "#selectinputtype option:selected" ).text() == "Advanced Input") {
		var tbodymain = $("#tabledataspinput").html("");
		addAdvancedInput()
	}
	else {
		var tbodymain = $("#tabledataspinput").html("");
		addBasicInput();
	}

});

$("#addfieldforcompileinput").on("click", function (){
	if($( "#selectinputtype option:selected" ).text() == "Advanced Input") 
		addAdvancedInput()
	else 
		addBasicInput();
});
function addBasicInput () {
	var tbodymain = $("#tabledataspinput");
		var tbody = $("<tr>").appendTo(tbodymain);
	var td1 = $("<td>").appendTo(tbody);
		$("<input>").addClass("texttofind").appendTo(td1);
}
function addAdvancedInput() {
	var tbodymain = $("#tabledataspinput");
	var tbody = $("<tr>").appendTo(tbodymain);
		var td1 = $("<td>").appendTo(tbody);
			$("<input>").addClass("texttofind").appendTo(td1);
		var td2 = $("<td>").appendTo(tbody);
			$("<input>").addClass("texttoreturn").appendTo(td2);
		var td3 = $("<td>").appendTo(tbody);
			$("<input>").addClass("useindexof").appendTo(td3).attr("type", "checkbox");
		var td4 = $("<td>").appendTo(tbody);
			var sel = $("<select>").addClass("numrepeats").appendTo(td4);
			for (var x = 1; x < 50;x ++) {
				$("<option>").html(x).appendTo(sel).val(x);
			}
}


