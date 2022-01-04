ALTER TABLE `tbl_status` CHANGE `sync_index` `block_number` INT(11) NOT NULL;
ALTER TABLE `tbl_history` CHANGE `sync_index` `block_number` INT(11) NOT NULL;
