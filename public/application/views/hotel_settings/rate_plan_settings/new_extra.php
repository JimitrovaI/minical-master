<tr class="extra-field-tr" id="<?php echo $extra_id; ?>">
	<td>
		<input name="name" type="text"  class="form-control" value="<?php echo $extra_name; ?>" maxlength="250" style="width:250px"/>
	</td>

	<td class="text-center">
		<select name="product-category-id" class="form-control">
			<?php foreach ($product_categories as $product_category) : ?>
				<option value="<?php echo $product_category->product_category_id; ?>" >
					<?php echo $product_category->product_category; ?>
				</option>
			<?php endforeach; ?>
		</select>
	</td>
    
    <td class="text-center">
        <select name="extra-charge-type-id" class="form-control">
			<?php foreach ($charge_types as $charge_type) : ?>
				<option value="<?php echo $charge_type['id']; ?>" >
					<?php echo $charge_type['name']; ?>
				</option>
			<?php endforeach; ?>
		</select>
    </td>

    <td class="text-center">
        <input name="default-rate" type="number" min="0" class="form-control" value="0"/>
    </td>
    
	<td class="text-center">
		<div class="delete-extra-button btn btn-default" id="<?php echo $extra_id; ?>">X</div>
	</td>
</tr>