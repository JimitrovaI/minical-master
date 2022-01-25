<div class="app-page-title">
	<div class="page-title-wrapper">
		<div class="page-title-heading">
			<div class="page-title-icon">
				<i class="pe-7s-ribbon text-success"></i>
			</div>
			<div><?php echo l('product_category_settings'); ?></h2>
				<div class="page-title-subheading"><span id="helpBlock" class="help-block">
						<?php echo l('Click existing fields to edit.', true); ?>
					</span></div>

			</div>
		</div>
	</div>
</div>


<div class="main-card mb-3 card">
	<div class="card-body">



		<!-- Hidden delete dialog-->
		<div id="confirm_delete_dialog"></div>
		<div class="table-responsive">
			<table class="table">
				<tr>
					<th><?php echo l('product_category'); ?></th>
					<th><?php echo l('delete_booking'); ?></th>
				</tr>
				<?php if (isset($product_categories)) : foreach ($product_categories as $product_category) : ?>
						<tr>
							<td>
								<div class="product-category-name-editable" id="<?php echo $product_category->product_category_id; ?>"><?php echo $product_category->product_category; ?></div>
							</td>
							<td>
								<div class="delete-product-category btn btn-light" id="<?php echo $product_category->product_category_id ?>">X</div>
							</td>
						</tr>
					<?php endforeach; ?>
				<?php else : ?>
					<h3><?php echo l('No Product categories have been recorded.', true); ?></h3>
				<?php endif; ?>
			</table>
		</div>


		<button id="add-product-category" class="btn btn-primary"><?php echo l('add_product_category'); ?></button>
	</div>
</div>