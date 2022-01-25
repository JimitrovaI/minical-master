innGrid.saveAllExtraFields = function () {
    console.log('here');
    var updatedExtraFields = {};
    $(".extra-field-tr").each(function () {
        var extraFieldTr = $(this);
        var extraFieldId = extraFieldTr.attr('id');
        var extraFieldName = extraFieldTr.find('[name="name"]').val();
        var extraCategoryId = extraFieldTr.find('[name="product-category-id"]').val();
        var extraChargeTypeID = extraFieldTr.find('[name="extra-charge-type-id"]').val();
        var chargingScheme = extraFieldTr.find('[name="charging-scheme"]').val();
        var defaultRate = extraFieldTr.find('[name="default-rate"]').val();

        var extraType = 'item';
        if (chargingScheme == 'once_a_day_inclusive_end_date') {
            extraType = 'item';
            chargingScheme = 'once_a_day';
        }
        if (chargingScheme == 'once_a_day_exclusive_end_date') {
            extraType = 'rental';
            chargingScheme = 'once_a_day';
        }

        updatedExtraFields[extraFieldId] = {
            extra_id: extraFieldId,
            extra_name: extraFieldName,
            extra_type: extraType,
            category_id: extraCategoryId,
            extra_charge_type_id: extraChargeTypeID,
            charging_scheme: chargingScheme,
            default_rate: defaultRate,
            show_on_pos: (extraFieldTr.find('[name="show_on_pos"]').prop('checked')) ? 1 : 0
        };
    });
    //Populate updates to standard customer field information
    $.post(getBaseURL() + 'settings/rates/update_extras', {
        updated_extras: updatedExtraFields
    }, function (result) {
        if (result.success) {
            alert(l('All Products saved'));
        }
        else {
            alert(result.error);
        }
    }, 'json');
}

$(function () {

    $('#add_extra').click(function () {

        $.post(getBaseURL() + 'settings/rates/create_extra', function (div) {

            $('#extras-fields').append(div);
        });
    });


    $('#save-all-extras-button').on("click", function () {

        innGrid.ExtraFieldSavedCount = 0;
        innGrid.saveAllExtraFields();

    });

    $(document).on('click', '.delete-extra-button', function () {
        var extraID = $(this).parent().parent().attr('id')
        var that = this;
        //Set custom buttons for delete dialog
        var r = confirm(l('Are you sure you want to delete this product?'));
        if (r == true) {
            $.post(getBaseURL() + 'settings/rates/delete_extra_AJAX', {
                extra_id: extraID
            }, function (results) {
                if (results.isSuccess == true) {
                    $(that).parent().parent().remove();  //delete line of X button
                    //alert(results.message);
                }
                else {
                    //alert(results.message);
                }
            }, 'json');
        }
    });

});

filterProducts = function () {
    
    var filtername = $('[name="filter_by_name"]').val();
    var filtercategory = $('[name="filter_by_category"]').val();
    var filterchargetype = $('[name="filter_by_charge_type"]').val();
    var filterminrate = $('[name="filter_by_min_rate"]').val();
    var filtermaxrate = $('[name="filter_by_max_rate"]').val();
    var filteredExtraFields = {
        extra_name: filtername,
        category_id: filtercategory,
        extra_charge_type_id: filterchargetype,
        min_rate: filterminrate,
        max_rate: filtermaxrate,
    };

    $.post(getBaseURL() + 'settings/rates/filter_extras', {
        filtered_extras: filteredExtraFields
    }, function (result) {
        $('#extras-fields').find('tbody').html(result);
    });
}