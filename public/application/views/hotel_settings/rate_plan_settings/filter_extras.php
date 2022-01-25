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
                <input name="default-rate" type="number" min="0" class="form-control" value="<?php echo $extra['rate']; ?>" />
            </td>

            <td class="text-center">
                <div class="delete-extra-button btn btn-light">X</div>
            </td>
        </tr>
    <?php endforeach; ?>

<?php else : ?>
    <h4><?php echo l('No products found.', true); ?></h4>
<?php endif; ?>