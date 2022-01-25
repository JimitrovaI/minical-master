
$(function() {


	$('#add-product-category').click(function () {
		$.post(getBaseURL() + 'settings/accounting/create_product_category', function (){
			window.location.reload();
		});		
	});


	$('.product-category-name-editable').editable(getBaseURL() + 'settings/accounting/change_product_category_name', {
		indicator: 'Saving...',
		tooltip: 'Click to edit...',
		cancel: 'Cancel',
		submit: 'Ok',
		id: 'product_category_id',
		name: 'product_category_name',
         onsubmit: function(settings, el) {
            var editId = el.id;
            var editName = $('input[name=product_category_name]').val();
            var checkProductCategory = false;
            $('.product-category-name-editable').each(function(){ 
                var productCategoryExitId =  $(this).attr('id');
                 var productCategoryExitName =  $(this).text();
                 if(productCategoryExitId != editId){
                     if(editName == productCategoryExitName){
                         alert(l('Product Category already exist!')); 
                         checkProductCategory = true;
                         return false;
                     }
                 }
                 
             });
             if(checkProductCategory == true){
                 return false;
             }
         }
	});
	
	
	$('.delete-product-category').click(function () {		
		var that = this;
		var productCategoryName = $(that).parent().parent().find('.product-category-name-editable').text();
		
		//Set custom buttons for delete dialog
		$("#confirm_delete_dialog")
		.html(l('Are you sure you want to remove product category ')+'<span class="product-category-name-editable">' + productCategoryName + '</span>?')
		.dialog({
			title:l('Delete Product Category'),
			buttons: {				
				"Confirm Delete":function() {					
					$.post(getBaseURL() + 'settings/accounting/delete_product_category', {
						product_category_id: $(that).attr('id')
						}, function (results) {							
							if (results.isSuccess == true){
									$(that).parent().parent().remove();  //delete line of X button
									//alert(results.message);
								}
								else {
									//alert(results.message);
								}
							}, 'json');
					$(this).dialog("close");
				},
				"Cancel": function() {
					$(this).dialog("close");
				}
			}
		});
		
		$("#confirm_delete_dialog").dialog("open");
	});
	
	
});