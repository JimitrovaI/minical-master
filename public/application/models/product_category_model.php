<?php

class Product_category_model extends CI_Model
{

    function __construct()
    {
        // Call the Model constructor
        parent::__construct();
    }

    function get_product_categories($company_id)
    {
        $this->db->where('company_id', $company_id);
        $this->db->where('is_deleted', 0);
        $this->db->where('is_read_only', 0); // read_only payment types are not shown

        $query = $this->db->get('product_category');

        if ($query->num_rows >= 1) {
            return $query->result();
        }

        return NULL;
    }

    function create_product_category($company_id, $product_category, $is_read_only = 0)
    {
        $data = array(
            'company_id' => $company_id,
            'product_category' => $product_category,
            'is_read_only' => $is_read_only
        );

        $this->db->insert('product_category', $data);

        $query = $this->db->query('select LAST_INSERT_ID( ) AS last_id');
        $result = $query->result_array();
        if (isset($result[0])) {
            return $result[0]['last_id'];
        } else {
            return null;
        }
    }

    function update_product_category($product_category_id, $data, $company_id = null)
    {
        $data = (object) $data;
        if ($company_id != null) {
            $this->db->where('company_id', $company_id);
        }

        $this->db->where('product_category_id', $product_category_id);
        $this->db->update('product_category', $data);

        //TO DO; Error if update fail.
        return TRUE;
    }

    function delete_product_category($company_id = null)
    {
        $this->db->where('company_id', $company_id);
        $this->db->delete('product_category');
    }
}
