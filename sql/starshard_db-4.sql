-- phpMyAdmin SQL Dump
-- version 4.9.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 29, 2021 at 01:01 PM
-- Server version: 10.4.10-MariaDB
-- PHP Version: 7.3.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Database: `starshard_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_game_setting`
--

CREATE TABLE `tbl_game_setting` (
  `id` int(11) NOT NULL,
  `category` varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  `kind` varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  `value` varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `tbl_game_setting`
--

INSERT INTO `tbl_game_setting` (`id`, `category`, `kind`, `value`, `created_at`, `updated_at`) VALUES
(1, 'Game', 'Version', '1.0', '2021-12-29 18:35:33', '2021-12-29 18:36:28'),
(2, 'PlantCycle', 'growthTime', '96', '2021-12-29 18:36:22', '2021-12-29 18:36:22'),
(3, 'PlantCycle', 'rewardTime', '72', '2021-12-29 18:36:56', '2021-12-29 18:36:56'),
(4, 'PlantCycle', 'decayTime', '24', '2021-12-29 18:39:17', '2021-12-29 18:39:17'),
(5, 'YieldRewards', 'rewardTier1', '70', '2021-12-29 18:39:54', '2021-12-29 18:39:54'),
(6, 'YieldRewards', 'rewardTier2', '20', '2021-12-29 18:40:34', '2021-12-29 18:40:34'),
(7, 'YieldRewards', 'rewardTier3', '10', '2021-12-29 18:40:51', '2021-12-29 18:40:51'),
(8, 'YieldRewards', 'rewardRate1', '2', '2021-12-29 18:41:10', '2021-12-29 18:41:10'),
(9, 'YieldRewards', 'rewardRate2', '5', '2021-12-29 18:41:20', '2021-12-29 18:41:20'),
(10, 'YieldRewards', 'rewardRate3', '10', '2021-12-29 18:41:33', '2021-12-29 18:41:33'),
(11, 'ItemPrices', 'commonSeed', '200', '2021-12-29 18:42:10', '2021-12-29 18:42:10'),
(12, 'ItemPrices', 'regularSeed', '1500', '2021-12-29 18:42:21', '2021-12-29 18:42:21'),
(13, 'ItemPrices', 'rareSeed', '3000', '2021-12-29 18:42:41', '2021-12-29 18:42:41'),
(14, 'ItemPrices', 'ultraSeed', '10000', '2021-12-29 18:43:55', '2021-12-29 18:43:55'),
(15, 'ItemPrices', 'legendSeed', '25000', '2021-12-29 18:44:08', '2021-12-29 18:44:08'),
(16, 'ItemPrices', 'stardust', '500', '2021-12-29 18:44:30', '2021-12-29 18:44:30');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_game_setting`
--
ALTER TABLE `tbl_game_setting`
  ADD PRIMARY KEY (`id`);
COMMIT;
