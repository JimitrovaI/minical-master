<!-- Help Modal -->
<!-- <div class="modal fade" id="help-modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title" id="myModalLabel"><?php echo l('About Products', true); ?></h4>
      </div>
      <div class="modal-body">
      	<p>
			<?php echo l('Products are a great way to apply charges to invoices that are re-occuring or date sensitive.
            For all other charges, we recommend adding them directly to the invoice.', true); ?>
		</p>
		<p>
			<strong><?php echo l('Products have two types', true); ?></strong>: <?php echo l('items and rentals. They differ in the way they apply charges to invoices.', true); ?>
		
			<?php echo l('Rentals, such extra beds, are charged the same way rooms are charged -- by night.
            They are charged based on the number of nights between the start and end date.
            For example, if the start date is 2012-06-20 and the end date 2012-06-22, the invoice will be charged 2 times;
            once when the selling date changes from 2012-06-20 to 2012-06-21 (for 2012-06-20),
            and once when the selling date changes from 2012-06-21 to 2012-06-22 (for 2012-06-21).', true); ?>
		
			<?php echo l('Items, such as tickets and food, are charged by day.
            They are charged based on the number of days that include the start and end date.
            For example, if the start date is 2012-06-20 and the end date 2012-06-22, the invoice will be charged 3 times;
            once when the selling date changes from 2012-06-20 to 2012-06-21 (for 2012-06-20),
            once when the selling date changes from 2012-06-21 to 2012-06-22 (for 2012-06-21),
            and once when the selling date changes from 2012-06-22 to 2012-06-23 (for 2012-06-22).
            NOTE: If the booking check-out date and the extra end date are the same for an item, 
            the charge will NOT be automatically applied to the invoice. 
            In this case, you will need to add a charge for the end date directly to the invoice.', true); ?>
		</p>
		<br />
		<p>
			<?php echo l('Products also have different', true); ?> <strong><?php echo l('charging schemes.', true); ?></strong> 
			<?php echo l('These are used to choose when and how you charge Products.', true); ?>
		</p>
		<br />
		<p>
			<?php echo l("Selecting 'on start date' charges the rate to the invoice only once on the the start date,
            but allows you to record the start and end date that the extra applies to.
            This can be useful for charging upfront fees or deposits for a rental.", true); ?>
		</p>
		<br />
		<p>
			<?php echo l("Selecting 'once a day' charges the rate on a re-occuring basis.
            Reoccuring charges operate as described in the rental and item descriptions above.", true); ?>
		</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal"><?php echo l('Close', true); ?></button>
      </div>
    </div>
  </div>
</div> -->

<div class="app-page-title">
    <div class="page-title-wrapper">
        <div class="page-title-heading">
            <div class="page-title-icon">
                <i class="pe-7s-albums text-success"></i>
            </div>
            <div>
                <?php echo l('Product Items'); ?>
                <!-- <a href="javascript:;" data-toggle="modal" data-target="#help-modal">(<?php echo l('About Products'); ?>)</a> -->
            </div>
        </div>
    </div>
</div>

<div class="main-card mb-3 card">
    <div class="card-body">
        <div id="confirm_delete_dialog"></div>
        <div class="table-responsive">
            <table id="extras-fields" class="table ">
                <thead>
                    <tr>
                        <th><?php echo l('Product Name'); ?></th>
                        <th class="text-center"><?php echo l('Product Category'); ?></th>
                        <th class="text-center"><?php echo l('charge_type'); ?></th>
                        <th class="text-center"><?php echo l('default_rate'); ?></th>
                        <th class="text-center"><?php echo l('delete'); ?></th>
                    </tr>
                    <tr>
                        <th>
                            <input name="filter_by_name" class="form-control" onchange="filterProducts();" type="text" placeholder="<?php echo l('Filter by Name'); ?>" maxlength="250" />
                        </th>
                        <th class="text-center">
                            <select name="filter_by_category" class="form-control" onchange="filterProducts();">
                                <option value=""><?php echo l('select_category'); ?></option>
                                <?php foreach ($product_categories as $product_category) : ?>
                                    <option value="<?php echo $product_category->product_category_id; ?>">
                                        <?php echo $product_category->product_category; ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </th>
                        <th class="text-center">
                            <select name="filter_by_charge_type" class="form-control" onchange="filterProducts();">
                                <option value=""><?php echo l('select_charge_type'); ?></option>
                                <?php foreach ($charge_types as $charge_type) : ?>
                                    <option value="<?php echo $charge_type['id']; ?>">
                                        <?php echo $charge_type['name']; ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </th>
                        <th class="text-center" style="max-width:150px; position:relative">
                            <div class="row">
                                <div class="col-sm-6">
                                    <input name="filter_by_min_rate" class="form-control" type="text" onchange="filterProducts();" placeholder="<?php echo l('Min'); ?>" />
                                </div>
                                <span style="position:absolute; left: 50%; top: 50%;transform: translate(-50%, -50%);">~</span>
                                <div class="col-sm-6">
                                    <input name="filter_by_max_rate" class="form-control" type="text" onchange="filterProducts();" placeholder="<?php echo l('Max'); ?>" />
                                </div>
                            </div>
                        </th>
                        <th class="text-center"></th>
                    </tr>

                    <tr>
                        <th colspan="5"></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (isset($extras)) : ?>
                        <?php foreach ($extras as $extra) : ?>
                            <tr class="extra-field-tr" id="<?php echo $extra['extra_id']; ?>">
                                <td>
                                    <input name="name" class="form-control" type="text" value="<?php echo $extra['extra_name']; ?>" maxlength="250" />
                                </td>

                                <td class="text-center">
                                    <select name="product-category-id" class="form-control">
                                        <?php foreach ($product_categories as $product_category) : ?>
                                            <option value="<?php echo $product_category->product_category_id; ?>" <?php if ($extra['category_id'] == $product_category->product_category_id) echo 'selected="selected"'; ?>>
                                                <?php echo $product_category->product_category; ?>
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                </td>

                                <td class="text-center">
                                    <select name="extra-charge-type-id" class="form-control">
                                        <?php foreach ($charge_types as $charge_type) : ?>
                                            <option value="<?php echo $charge_type['id']; ?>" <?php if ($extra['charge_type_id'] == $charge_type['id']) echo 'selected="selected"'; ?>>
                                                <?php echo $charge_type['name']; ?>
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                </td>

                                <td class="text-center">
                                    <input name="default-rate" type="number" min="0" class="form-control" value="<?php if (isset($extra['default_extra_rate']['rate'])) {
                                                                                                                        echo $extra['default_extra_rate']['rate'];
                                                                                                                    } else {
                                                                                                                        echo 0;
                                                                                                                    } ?>" />
                                </td>

                                <td class="text-center">
                                    <div class="delete-extra-button btn btn-light">X</div>
                                </td>
                            </tr>
                        <?php endforeach; ?>

                    <?php else : ?>
                        <h3><?php echo l('No products found.', true); ?></h3>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <br />
        <button id="add_extra" class="btn btn-light"><?php echo l('Add Product'); ?></button>
        <button id="save-all-extras-button" class="btn btn-primary"><?php echo l('save_all'); ?></button>
    </div>
</div>