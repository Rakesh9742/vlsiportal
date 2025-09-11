-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: vlsi_portal
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_user` (`user_id`),
  KEY `idx_activity_action` (`action`),
  KEY `idx_activity_entity` (`entity_type`,`entity_id`),
  KEY `idx_activity_created` (`created_at`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chat_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `message_type` enum('text','image','file','system') DEFAULT 'text',
  `content` text NOT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `is_edited` tinyint(1) DEFAULT '0',
  `edited_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_chat` (`chat_id`),
  KEY `idx_chat_messages_sender` (`sender_id`),
  KEY `idx_chat_messages_type` (`message_type`),
  KEY `idx_chat_messages_created` (`created_at`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`chat_id`) REFERENCES `query_chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `update_chat_last_message` AFTER INSERT ON `chat_messages` FOR EACH ROW BEGIN
    UPDATE query_chats 
    SET last_message_at = NEW.created_at 
    WHERE id = NEW.chat_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `chat_participants`
--

DROP TABLE IF EXISTS `chat_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_participants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chat_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('student','expert','admin') NOT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_chat_user` (`chat_id`,`user_id`),
  KEY `idx_chat_participants_chat` (`chat_id`),
  KEY `idx_chat_participants_user` (`user_id`),
  KEY `idx_chat_participants_role` (`role`),
  CONSTRAINT `chat_participants_ibfk_1` FOREIGN KEY (`chat_id`) REFERENCES `query_chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_participants`
--

LOCK TABLES `chat_participants` WRITE;
/*!40000 ALTER TABLE `chat_participants` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `domain_stats_view`
--

DROP TABLE IF EXISTS `domain_stats_view`;
/*!50001 DROP VIEW IF EXISTS `domain_stats_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `domain_stats_view` AS SELECT 
 1 AS `domain_id`,
 1 AS `domain_name`,
 1 AS `domain_description`,
 1 AS `total_users`,
 1 AS `student_count`,
 1 AS `expert_reviewer_count`,
 1 AS `professional_count`,
 1 AS `total_queries`,
 1 AS `open_queries`,
 1 AS `in_progress_queries`,
 1 AS `resolved_queries`,
 1 AS `closed_queries`,
 1 AS `urgent_queries`,
 1 AS `high_priority_queries`,
 1 AS `medium_priority_queries`,
 1 AS `low_priority_queries`,
 1 AS `avg_resolution_days`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `domains`
--

DROP TABLE IF EXISTS `domains`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `domains` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_domains_name` (`name`),
  KEY `idx_domains_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `domains`
--

LOCK TABLES `domains` WRITE;
/*!40000 ALTER TABLE `domains` DISABLE KEYS */;
INSERT INTO `domains` VALUES (1,'Physical Design','Digital IC physical design and layout',1,'2025-09-05 06:10:49','2025-09-05 06:10:49'),(2,'Analog Layout','Analog circuit layout design',1,'2025-09-05 06:10:49','2025-09-05 06:10:49'),(3,'Design Verification','Design verification and testing',1,'2025-09-05 06:10:49','2025-09-05 06:10:49'),(4,'DFT','Design for Testability',1,'2025-09-05 06:10:49','2025-09-05 06:10:49'),(5,'Analog Design','Analog circuit design and simulation',1,'2025-09-05 06:10:49','2025-09-05 06:10:49'),(6,'Architecture','System architecture and high-level design',1,'2025-09-05 06:10:49','2025-09-05 06:10:49'),(7,'Specification','System specification and requirements analysis',1,'2025-09-05 06:10:49','2025-09-05 06:10:49');
/*!40000 ALTER TABLE `domains` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `expert_workload_view`
--

DROP TABLE IF EXISTS `expert_workload_view`;
/*!50001 DROP VIEW IF EXISTS `expert_workload_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `expert_workload_view` AS SELECT 
 1 AS `expert_id`,
 1 AS `expert_name`,
 1 AS `expert_username`,
 1 AS `domain_name`,
 1 AS `total_assignments`,
 1 AS `pending_assignments`,
 1 AS `accepted_assignments`,
 1 AS `completed_assignments`,
 1 AS `total_queries`,
 1 AS `open_queries`,
 1 AS `in_progress_queries`,
 1 AS `resolved_queries`,
 1 AS `total_responses`,
 1 AS `solution_responses`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `issue_categories`
--

DROP TABLE IF EXISTS `issue_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `issue_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stage_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `severity` enum('low','medium','high','critical') DEFAULT 'medium',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category_stage` (`name`,`stage_id`),
  KEY `idx_issue_categories_stage` (`stage_id`),
  KEY `idx_issue_categories_name` (`name`),
  KEY `idx_issue_categories_severity` (`severity`),
  KEY `idx_issue_categories_active` (`is_active`),
  CONSTRAINT `issue_categories_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=218 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `issue_categories`
--

LOCK TABLES `issue_categories` WRITE;
/*!40000 ALTER TABLE `issue_categories` DISABLE KEYS */;
INSERT INTO `issue_categories` VALUES (1,1,'SDC','Synopsys Design Constraints','high',1,'2025-09-05 06:10:49'),(2,1,'RTL','RTL design issues','medium',1,'2025-09-05 06:10:49'),(3,1,'.lib','Library file issues','high',1,'2025-09-05 06:10:49'),(4,1,'Optimization','Synthesis optimization issues','medium',1,'2025-09-05 06:10:49'),(5,1,'Timing','Timing related issues','high',1,'2025-09-05 06:10:49'),(6,1,'Area','Area optimization issues','medium',1,'2025-09-05 06:10:49'),(7,1,'Power','Power optimization issues','medium',1,'2025-09-05 06:10:49'),(8,1,'Clock Gating','Clock gating implementation','medium',1,'2025-09-05 06:10:49'),(9,1,'Multibit Flops','Multibit flip-flop issues','low',1,'2025-09-05 06:10:49'),(10,1,'Tool','Tool-related issues during synthesis','medium',1,'2025-09-05 06:10:49'),(11,2,'Tech LEF','Technology LEF file issues','high',1,'2025-09-05 06:10:49'),(12,2,'LEF','LEF file issues','high',1,'2025-09-05 06:10:49'),(13,2,'NDM','NDM file issues','high',1,'2025-09-05 06:10:49'),(14,2,'ITF','ITF file issues','medium',1,'2025-09-05 06:10:49'),(15,2,'TLUPLUS','TLUPLUS file issues','medium',1,'2025-09-05 06:10:49'),(16,2,'QRC Tech','QRC technology file issues','medium',1,'2025-09-05 06:10:49'),(17,2,'Netlist','Netlist file issues','high',1,'2025-09-05 06:10:49'),(18,2,'SDC','SDC file issues','high',1,'2025-09-05 06:10:49'),(19,2,'MMMC','MMMC file issues','medium',1,'2025-09-05 06:10:49'),(20,2,'Tool','Tool-related issues during design initialization','medium',1,'2025-09-05 06:10:49'),(21,3,'Macro Placement','Macro cell placement issues','high',1,'2025-09-05 06:10:49'),(22,3,'Power Planning','Power planning issues','high',1,'2025-09-05 06:10:49'),(23,3,'Endcap','Endcap cell issues','medium',1,'2025-09-05 06:10:49'),(24,3,'Tap Cells','Tap cell issues','medium',1,'2025-09-05 06:10:49'),(25,3,'Placement Blockages','Placement blockage issues','medium',1,'2025-09-05 06:10:49'),(26,3,'Macro Halo (Keepout)','Macro halo keepout issues','medium',1,'2025-09-05 06:10:49'),(27,3,'Tool','Tool-related issues during floorplan','medium',1,'2025-09-05 06:10:49'),(28,4,'SDC','SDC constraints during placement','high',1,'2025-09-05 06:10:49'),(29,4,'Bounds','Placement bounds issues','medium',1,'2025-09-05 06:10:49'),(30,4,'Port Buffers','Port buffer issues','medium',1,'2025-09-05 06:10:49'),(31,4,'Setup Timing','Setup timing violations','high',1,'2025-09-05 06:10:49'),(32,4,'DRVs','Design rule violations','high',1,'2025-09-05 06:10:49'),(33,4,'Cell Density','Cell density issues','medium',1,'2025-09-05 06:10:49'),(34,4,'Pin Density','Pin density issues','medium',1,'2025-09-05 06:10:49'),(35,4,'Congestion','Congestion issues','high',1,'2025-09-05 06:10:49'),(36,4,'Optimization','Placement optimization issues','medium',1,'2025-09-05 06:10:49'),(37,4,'Scan Reordering','Scan chain reordering','low',1,'2025-09-05 06:10:49'),(38,4,'Tool','Tool-related issues during placement','medium',1,'2025-09-05 06:10:49'),(39,5,'Clock Skew','Clock skew issues','high',1,'2025-09-05 06:10:49'),(40,5,'Clock Latency','Clock latency issues','high',1,'2025-09-05 06:10:49'),(41,5,'Clock Tree Exceptions','Clock tree exception issues','medium',1,'2025-09-05 06:10:49'),(42,5,'Clock Cells','Clock cell issues','medium',1,'2025-09-05 06:10:49'),(43,5,'Clock NDR','Clock non-default routing','medium',1,'2025-09-05 06:10:49'),(44,5,'Clock Routing','Clock routing issues','medium',1,'2025-09-05 06:10:49'),(45,5,'Congestion','Congestion during CTS','high',1,'2025-09-05 06:10:49'),(46,5,'Cell Density','Cell density during CTS','medium',1,'2025-09-05 06:10:49'),(47,5,'CCD','Clock common path pessimism','low',1,'2025-09-05 06:10:49'),(48,5,'CCOPT','Clock optimization issues','medium',1,'2025-09-05 06:10:49'),(49,5,'Setup Timing','Setup timing during CTS','high',1,'2025-09-05 06:10:49'),(50,5,'Clock Path DRVs','Clock path design rule violations','high',1,'2025-09-05 06:10:49'),(51,5,'Clock Gating Setup','Clock gating setup issues','medium',1,'2025-09-05 06:10:49'),(52,5,'Tool','Tool-related issues during CTS','medium',1,'2025-09-05 06:10:49'),(119,18,'Matching (devices, nets - resistances, capacitance)','Device and net matching issues','high',1,'2025-09-05 09:03:59'),(120,18,'High speed','High speed design issues','high',1,'2025-09-05 09:03:59'),(121,18,'High Voltage','High voltage design issues','high',1,'2025-09-05 09:03:59'),(122,18,'Different voltage domains','Multi-voltage domain issues','high',1,'2025-09-05 09:03:59'),(123,18,'Clk & Data paths','Clock and data path issues','medium',1,'2025-09-05 09:03:59'),(124,18,'Power (current & voltage) ratings','Power rating issues','high',1,'2025-09-05 09:03:59'),(125,18,'Branch currents','Branch current analysis issues','medium',1,'2025-09-05 09:03:59'),(126,18,'Node Voltages in cross voltage domains','Cross-domain voltage issues','high',1,'2025-09-05 09:03:59'),(128,19,'Devices Placement','Device placement issues','high',1,'2025-09-05 09:03:59'),(129,19,'Macro placement','Macro placement issues','high',1,'2025-09-05 09:03:59'),(130,19,'Power planning','Power planning issues','high',1,'2025-09-05 09:03:59'),(131,19,'Different types of MOS devices','MOS device type issues','medium',1,'2025-09-05 09:03:59'),(132,19,'Different types of devices','Device type issues','medium',1,'2025-09-05 09:03:59'),(133,19,'Blocks integration','Block integration issues','medium',1,'2025-09-05 09:03:59'),(134,19,'Analog & Digital blocks integration','Mixed-signal integration issues','high',1,'2025-09-05 09:03:59'),(135,19,'Area','Area optimization issues','medium',1,'2025-09-05 09:03:59'),(136,19,'ESD & Clamps integration','ESD and clamp integration issues','high',1,'2025-09-05 09:03:59'),(137,19,'Latchup','Latchup prevention issues','high',1,'2025-09-05 09:03:59'),(139,20,'Opens','Open circuit issues','high',1,'2025-09-05 09:03:59'),(140,20,'Shorts','Short circuit issues','high',1,'2025-09-05 09:03:59'),(141,20,'DRCs','Design rule checking violations','high',1,'2025-09-05 09:03:59'),(142,20,'High Speed signal routing','High speed signal routing issues','high',1,'2025-09-05 09:03:59'),(143,20,'High Current','High current routing issues','high',1,'2025-09-05 09:03:59'),(144,20,'Power mesh','Power mesh routing issues','high',1,'2025-09-05 09:03:59'),(145,20,'Crosstalk','Crosstalk issues','medium',1,'2025-09-05 09:03:59'),(147,21,'GDS','GDS file generation issues','high',1,'2025-09-05 09:03:59'),(148,21,'LEF','LEF file generation issues','medium',1,'2025-09-05 09:03:59'),(149,21,'DEF','DEF file generation issues','medium',1,'2025-09-05 09:03:59'),(150,21,'Netlist','Netlist generation issues','high',1,'2025-09-05 09:03:59'),(151,21,'PV reports','Physical verification report issues','medium',1,'2025-09-05 09:03:59'),(152,21,'PERC & ESD reports','PERC and ESD report issues','medium',1,'2025-09-05 09:03:59'),(154,22,'Design updates','Design update issues','medium',1,'2025-09-05 09:03:59'),(155,22,'Post layout sims','Post layout simulation issues','high',1,'2025-09-05 09:03:59'),(156,22,'LVS fail','LVS failure issues','high',1,'2025-09-05 09:03:59'),(158,23,'Design updates','Design update issues','high',1,'2025-09-05 09:03:59'),(159,23,'Post layout sims updates','Post layout simulation update issues','high',1,'2025-09-05 09:03:59'),(160,23,'Clk & Data Timing','Clock and data timing issues','high',1,'2025-09-05 09:03:59'),(162,24,'Static IR drop analysis','Static IR drop analysis issues','high',1,'2025-09-05 09:03:59'),(163,24,'Dynamic IR drop analysis','Dynamic IR drop analysis issues','high',1,'2025-09-05 09:03:59'),(164,24,'Power EM Iavg','Power electromigration average current issues','high',1,'2025-09-05 09:03:59'),(165,24,'Power EM Irms','Power electromigration RMS current issues','high',1,'2025-09-05 09:03:59'),(166,24,'Signal EM Iavg','Signal electromigration average current issues','medium',1,'2025-09-05 09:03:59'),(167,24,'Signal EM Irms','Signal electromigration RMS current issues','medium',1,'2025-09-05 09:03:59'),(168,24,'EMIR calculations','EMIR calculation issues','medium',1,'2025-09-05 09:03:59'),(170,25,'DRC','Design rule checking violations','high',1,'2025-09-05 09:03:59'),(171,25,'DFM','Design for manufacturability issues','medium',1,'2025-09-05 09:03:59'),(172,25,'ANT','Antenna effect issues','medium',1,'2025-09-05 09:03:59'),(173,25,'LVS','Layout vs schematic verification issues','high',1,'2025-09-05 09:03:59'),(174,25,'ERC','Electrical rule checking issues','medium',1,'2025-09-05 09:03:59'),(175,25,'PERC','Process and environment rule checking issues','medium',1,'2025-09-05 09:03:59'),(176,25,'Bump','Bump design issues','medium',1,'2025-09-05 09:03:59'),(177,25,'ESD','ESD verification issues','high',1,'2025-09-05 09:03:59'),(178,25,'Density','Metal density issues','low',1,'2025-09-05 09:03:59'),(180,26,'ESD types','ESD type selection issues','high',1,'2025-09-05 09:03:59'),(181,26,'ESD sizes','ESD sizing issues','high',1,'2025-09-05 09:03:59'),(182,26,'Clamps','ESD clamp design issues','high',1,'2025-09-05 09:03:59'),(183,26,'Resistance','ESD resistance issues','medium',1,'2025-09-05 09:03:59'),(184,26,'ESD voltage values','ESD voltage specification issues','high',1,'2025-09-05 09:03:59'),(186,27,'Bond Pads','Bond pad design issues','high',1,'2025-09-05 09:03:59'),(187,27,'Different types of Bond pads','Bond pad type selection issues','medium',1,'2025-09-05 09:03:59'),(188,27,'Probe pads','Probe pad design issues','medium',1,'2025-09-05 09:03:59'),(189,27,'RDL Routing','Redistribution layer routing issues','medium',1,'2025-09-05 09:03:59'),(191,28,'CSP (Chip Scale package)','Chip scale package issues','medium',1,'2025-09-05 09:03:59'),(192,28,'Wire bond','Wire bonding issues','medium',1,'2025-09-05 09:03:59'),(194,29,'PDKs','Process design kit issues','high',1,'2025-09-05 09:03:59'),(195,29,'Tech file','Technology file issues','high',1,'2025-09-05 09:03:59'),(196,29,'Display file','Display file issues','low',1,'2025-09-05 09:03:59'),(197,29,'Metal stack (FEOL, MEOL, BEOL)','Metal stack issues','high',1,'2025-09-05 09:03:59'),(198,29,'DRM (Design Rule Manual)','Design rule manual issues','high',1,'2025-09-05 09:03:59'),(199,29,'Rule decks','Rule deck issues','high',1,'2025-09-05 09:03:59'),(201,30,'Project DB','Project database issues','medium',1,'2025-09-05 09:03:59'),(202,30,'Layout Design DB','Layout design database issues','medium',1,'2025-09-05 09:03:59'),(203,30,'Schematic design DB','Schematic design database issues','medium',1,'2025-09-05 09:03:59'),(204,30,'Check list DB','Checklist database issues','low',1,'2025-09-05 09:03:59'),(205,30,'Design DB check-in','Design database check-in issues','medium',1,'2025-09-05 09:03:59'),(206,30,'Design DB check-out','Design database check-out issues','medium',1,'2025-09-05 09:03:59'),(207,30,'Design DB access or edit permission','Database access permission issues','medium',1,'2025-09-05 09:03:59'),(209,31,'Devices used','Device usage tracking issues','medium',1,'2025-09-05 09:03:59'),(210,31,'Additional cost Masks','Additional mask cost issues','medium',1,'2025-09-05 09:03:59'),(211,31,'DB Prefixing','Database prefixing issues','low',1,'2025-09-05 09:03:59'),(212,31,'Shapes out side of Boundary','Boundary violation issues','high',1,'2025-09-05 09:03:59'),(213,31,'LEF vs GDS','LEF vs GDS consistency issues','high',1,'2025-09-05 09:03:59'),(214,31,'LEF vs Verilog','LEF vs Verilog consistency issues','high',1,'2025-09-05 09:03:59'),(215,31,'Design Reviews','Design review issues','medium',1,'2025-09-05 09:03:59'),(216,31,'Cross team release','Cross-team release issues','medium',1,'2025-09-05 09:03:59');
/*!40000 ALTER TABLE `issue_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_read_status`
--

DROP TABLE IF EXISTS `message_read_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_read_status` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message_id` int NOT NULL,
  `user_id` int NOT NULL,
  `read_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_message_user` (`message_id`,`user_id`),
  KEY `idx_message_read_message` (`message_id`),
  KEY `idx_message_read_user` (`user_id`),
  CONSTRAINT `message_read_status_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `chat_messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `message_read_status_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2150 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_read_status`
--

LOCK TABLES `message_read_status` WRITE;
/*!40000 ALTER TABLE `message_read_status` DISABLE KEYS */;
/*!40000 ALTER TABLE `message_read_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_preferences`
--

DROP TABLE IF EXISTS `notification_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `response_added` tinyint(1) DEFAULT '1',
  `response_updated` tinyint(1) DEFAULT '1',
  `status_changed` tinyint(1) DEFAULT '1',
  `query_assigned` tinyint(1) DEFAULT '1',
  `email_notifications` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_notification_prefs_user` (`user_id`),
  CONSTRAINT `notification_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_preferences`
--

LOCK TABLES `notification_preferences` WRITE;
/*!40000 ALTER TABLE `notification_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `query_id` int NOT NULL,
  `type` enum('response_added','response_updated','status_changed','query_assigned','query_created','chat_message','query_edited') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` timestamp NULL DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`),
  KEY `idx_notifications_query` (`query_id`),
  KEY `idx_notifications_type` (`type`),
  KEY `idx_notifications_read` (`is_read`),
  KEY `idx_notifications_created` (`created_at`),
  KEY `idx_notifications_user_read` (`user_id`,`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`query_id`) REFERENCES `queries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (32,1,29,'query_created','New Query Created','A new query \"fgfgfdgfdgfdgfgfg\" has been created by Rakesh',1,'2025-09-09 06:44:21','2025-09-09 06:44:27','{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(33,12,29,'query_created','New Query Created','A new query \"fgfgfdgfdgfdgfgfg\" has been created by Rakesh',0,'2025-09-09 06:44:21',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(34,13,29,'query_created','New Query Created','A new query \"fgfgfdgfdgfdgfgfg\" has been created by Rakesh',0,'2025-09-09 06:44:21',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(35,14,29,'query_created','New Query Created','A new query \"fgfgfdgfdgfdgfgfg\" has been created by Rakesh',0,'2025-09-09 06:44:21',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(36,15,29,'query_created','New Query Created','A new query \"fgfgfdgfdgfdgfgfg\" has been created by Rakesh',0,'2025-09-09 06:44:21',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(37,16,29,'query_created','New Query Created','A new query \"fgfgfdgfdgfdgfgfg\" has been created by Rakesh',0,'2025-09-09 06:44:21',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(38,17,29,'query_created','New Query Created','A new query \"fgfgfdgfdgfdgfgfg\" has been created by Rakesh',0,'2025-09-09 06:44:21',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(39,18,29,'query_created','New Query Created','A new query \"fgfgfdgfdgfdgfgfg\" has been created by Rakesh',0,'2025-09-09 06:44:21',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(40,19,29,'status_changed','Query Status Updated','System Administrator has updated the status of your query \"fgfgfdgfdgfdgfgfg\" to resolved',1,'2025-09-09 06:45:37','2025-09-09 06:46:36','{\"new_status\": \"resolved\", \"updater_id\": 1, \"updater_name\": \"System Administrator\"}'),(43,1,30,'query_created','New Query Created','A new query \"hjhj\" has been created by Rakesh',1,'2025-09-09 07:05:44','2025-09-09 07:06:35','{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(44,12,30,'query_created','New Query Created','A new query \"hjhj\" has been created by Rakesh',0,'2025-09-09 07:05:44',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(45,13,30,'query_created','New Query Created','A new query \"hjhj\" has been created by Rakesh',0,'2025-09-09 07:05:44',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(46,14,30,'query_created','New Query Created','A new query \"hjhj\" has been created by Rakesh',0,'2025-09-09 07:05:44',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(47,15,30,'query_created','New Query Created','A new query \"hjhj\" has been created by Rakesh',0,'2025-09-09 07:05:44',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(48,16,30,'query_created','New Query Created','A new query \"hjhj\" has been created by Rakesh',0,'2025-09-09 07:05:44',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(49,17,30,'query_created','New Query Created','A new query \"hjhj\" has been created by Rakesh',0,'2025-09-09 07:05:44',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(50,18,30,'query_created','New Query Created','A new query \"hjhj\" has been created by Rakesh',0,'2025-09-09 07:05:44',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(51,19,30,'response_added','New Response to Your Query','System Administrator has responded to your query: \"hjhj\"',1,'2025-09-09 07:05:55','2025-09-09 07:39:28','{\"responder_id\": 1, \"responder_name\": \"System Administrator\"}'),(52,19,30,'status_changed','Query Status Updated','System Administrator has updated the status of your query \"hjhj\" to resolved',1,'2025-09-09 07:05:56','2025-09-09 07:39:28','{\"new_status\": \"resolved\", \"updater_id\": 1, \"updater_name\": \"System Administrator\"}'),(53,1,31,'query_created','New Query Created','A new query \"xcvcv\" has been created by Rakesh',1,'2025-09-09 09:18:57','2025-09-09 09:19:08','{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(54,12,31,'query_created','New Query Created','A new query \"xcvcv\" has been created by Rakesh',0,'2025-09-09 09:18:57',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(55,13,31,'query_created','New Query Created','A new query \"xcvcv\" has been created by Rakesh',0,'2025-09-09 09:18:57',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(56,14,31,'query_created','New Query Created','A new query \"xcvcv\" has been created by Rakesh',0,'2025-09-09 09:18:57',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(57,15,31,'query_created','New Query Created','A new query \"xcvcv\" has been created by Rakesh',0,'2025-09-09 09:18:57',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(58,16,31,'query_created','New Query Created','A new query \"xcvcv\" has been created by Rakesh',0,'2025-09-09 09:18:57',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(59,17,31,'query_created','New Query Created','A new query \"xcvcv\" has been created by Rakesh',0,'2025-09-09 09:18:57',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(60,18,31,'query_created','New Query Created','A new query \"xcvcv\" has been created by Rakesh',0,'2025-09-09 09:18:57',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(61,1,32,'query_created','New Query Created','A new query \"fdgfg\" has been created by Rakesh',1,'2025-09-09 09:22:23','2025-09-09 09:22:49','{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(62,12,32,'query_created','New Query Created','A new query \"fdgfg\" has been created by Rakesh',0,'2025-09-09 09:22:23',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(63,13,32,'query_created','New Query Created','A new query \"fdgfg\" has been created by Rakesh',0,'2025-09-09 09:22:23',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(64,14,32,'query_created','New Query Created','A new query \"fdgfg\" has been created by Rakesh',0,'2025-09-09 09:22:23',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(65,15,32,'query_created','New Query Created','A new query \"fdgfg\" has been created by Rakesh',0,'2025-09-09 09:22:23',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(66,16,32,'query_created','New Query Created','A new query \"fdgfg\" has been created by Rakesh',0,'2025-09-09 09:22:23',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(67,17,32,'query_created','New Query Created','A new query \"fdgfg\" has been created by Rakesh',0,'2025-09-09 09:22:23',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(68,18,32,'query_created','New Query Created','A new query \"fdgfg\" has been created by Rakesh',0,'2025-09-09 09:22:23',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(69,1,33,'query_created','New Query Created','A new query \"retgrtre\" has been created by Rakesh',1,'2025-09-09 09:23:59','2025-09-09 09:25:10','{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(70,12,33,'query_created','New Query Created','A new query \"retgrtre\" has been created by Rakesh',0,'2025-09-09 09:23:59',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(71,13,33,'query_created','New Query Created','A new query \"retgrtre\" has been created by Rakesh',0,'2025-09-09 09:23:59',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(72,14,33,'query_created','New Query Created','A new query \"retgrtre\" has been created by Rakesh',0,'2025-09-09 09:23:59',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(73,15,33,'query_created','New Query Created','A new query \"retgrtre\" has been created by Rakesh',0,'2025-09-09 09:23:59',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(74,16,33,'query_created','New Query Created','A new query \"retgrtre\" has been created by Rakesh',0,'2025-09-09 09:23:59',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(75,17,33,'query_created','New Query Created','A new query \"retgrtre\" has been created by Rakesh',0,'2025-09-09 09:23:59',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(76,18,33,'query_created','New Query Created','A new query \"retgrtre\" has been created by Rakesh',0,'2025-09-09 09:23:59',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(77,1,34,'query_created','New Query Created','A new query \"fgbfg\" has been created by Rakesh',0,'2025-09-09 09:30:00',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(78,12,34,'query_created','New Query Created','A new query \"fgbfg\" has been created by Rakesh',0,'2025-09-09 09:30:00',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(79,13,34,'query_created','New Query Created','A new query \"fgbfg\" has been created by Rakesh',0,'2025-09-09 09:30:00',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(80,14,34,'query_created','New Query Created','A new query \"fgbfg\" has been created by Rakesh',0,'2025-09-09 09:30:00',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(81,15,34,'query_created','New Query Created','A new query \"fgbfg\" has been created by Rakesh',0,'2025-09-09 09:30:00',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(82,16,34,'query_created','New Query Created','A new query \"fgbfg\" has been created by Rakesh',0,'2025-09-09 09:30:00',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(83,17,34,'query_created','New Query Created','A new query \"fgbfg\" has been created by Rakesh',0,'2025-09-09 09:30:00',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(84,18,34,'query_created','New Query Created','A new query \"fgbfg\" has been created by Rakesh',0,'2025-09-09 09:30:00',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(85,1,35,'query_created','New Query Created','A new query \"ffsd\" has been created by Rakesh',0,'2025-09-09 09:40:52',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(86,12,35,'query_created','New Query Created','A new query \"ffsd\" has been created by Rakesh',0,'2025-09-09 09:40:52',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(87,13,35,'query_created','New Query Created','A new query \"ffsd\" has been created by Rakesh',0,'2025-09-09 09:40:52',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(88,14,35,'query_created','New Query Created','A new query \"ffsd\" has been created by Rakesh',0,'2025-09-09 09:40:52',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(89,15,35,'query_created','New Query Created','A new query \"ffsd\" has been created by Rakesh',0,'2025-09-09 09:40:52',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(90,16,35,'query_created','New Query Created','A new query \"ffsd\" has been created by Rakesh',0,'2025-09-09 09:40:52',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(91,17,35,'query_created','New Query Created','A new query \"ffsd\" has been created by Rakesh',0,'2025-09-09 09:40:52',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(92,18,35,'query_created','New Query Created','A new query \"ffsd\" has been created by Rakesh',0,'2025-09-09 09:40:52',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(93,1,36,'query_created','New Query Created','A new query \"vbxcb\" has been created by Rakesh',0,'2025-09-09 09:41:46',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(94,12,36,'query_created','New Query Created','A new query \"vbxcb\" has been created by Rakesh',0,'2025-09-09 09:41:46',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(95,13,36,'query_created','New Query Created','A new query \"vbxcb\" has been created by Rakesh',0,'2025-09-09 09:41:46',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(96,14,36,'query_created','New Query Created','A new query \"vbxcb\" has been created by Rakesh',0,'2025-09-09 09:41:46',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(97,15,36,'query_created','New Query Created','A new query \"vbxcb\" has been created by Rakesh',0,'2025-09-09 09:41:46',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(98,16,36,'query_created','New Query Created','A new query \"vbxcb\" has been created by Rakesh',0,'2025-09-09 09:41:46',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(99,17,36,'query_created','New Query Created','A new query \"vbxcb\" has been created by Rakesh',0,'2025-09-09 09:41:46',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}'),(100,18,36,'query_created','New Query Created','A new query \"vbxcb\" has been created by Rakesh',0,'2025-09-09 09:41:46',NULL,'{\"student_id\": 19, \"student_name\": \"Rakesh\"}');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `queries`
--

DROP TABLE IF EXISTS `queries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `queries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `custom_query_id` varchar(50) DEFAULT NULL,
  `student_id` int NOT NULL,
  `expert_reviewer_id` int DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `tool_id` int DEFAULT NULL,
  `technology` varchar(100) DEFAULT NULL,
  `stage_id` int DEFAULT NULL,
  `custom_stage` varchar(200) DEFAULT NULL,
  `issue_category_id` int DEFAULT NULL,
  `custom_issue_category` varchar(200) DEFAULT NULL,
  `status` enum('open','in_progress','resolved','closed') DEFAULT 'open',
  `chat_enabled` tinyint(1) DEFAULT '1',
  `chat_created_at` timestamp NULL DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `resolution_attempts` int DEFAULT '0',
  `resolution` text,
  `debug_steps` text,
  `tags` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `is_edited` tinyint(1) DEFAULT '0',
  `edit_count` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `custom_query_id` (`custom_query_id`),
  KEY `issue_category_id` (`issue_category_id`),
  KEY `idx_queries_student` (`student_id`),
  KEY `idx_queries_expert` (`expert_reviewer_id`),
  KEY `idx_queries_status` (`status`),
  KEY `idx_queries_priority` (`priority`),
  KEY `idx_queries_stage` (`stage_id`),
  KEY `idx_queries_tool` (`tool_id`),
  KEY `idx_queries_technology` (`technology`),
  KEY `idx_queries_created` (`created_at`),
  KEY `idx_queries_updated` (`updated_at`),
  KEY `idx_queries_custom_id` (`custom_query_id`),
  KEY `idx_queries_resolved` (`resolved_at`),
  KEY `idx_queries_chat_enabled` (`chat_enabled`),
  CONSTRAINT `queries_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `queries_ibfk_2` FOREIGN KEY (`expert_reviewer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `queries_ibfk_3` FOREIGN KEY (`tool_id`) REFERENCES `tools` (`id`) ON DELETE SET NULL,
  CONSTRAINT `queries_ibfk_4` FOREIGN KEY (`stage_id`) REFERENCES `stages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `queries_ibfk_5` FOREIGN KEY (`issue_category_id`) REFERENCES `issue_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `queries`
--

LOCK TABLES `queries` WRITE;
/*!40000 ALTER TABLE `queries` DISABLE KEYS */;
INSERT INTO `queries` VALUES (29,'S19AL004',19,NULL,'fgfgfdgfdgfdgfgfg','fgfg',16,'fgfdg',20,NULL,141,NULL,'resolved',1,NULL,'medium',0,'dfgfdgf','dfgfg',NULL,'2025-09-09 06:44:21','2025-09-09 06:45:37',NULL,0,0),(30,'S19AL005',19,1,'hjhj','ghjhgj',18,'hjhj',18,NULL,122,NULL,'resolved',1,NULL,'medium',0,'hjghj','hjhj',NULL,'2025-09-09 07:05:44','2025-09-09 07:05:56',NULL,0,0),(31,'S19AL006',19,NULL,'xcvcv','xcvcv',17,'cvxcv',NULL,'cvcv,cvcv',NULL,'cvcv','open',1,NULL,'medium',0,'xcvcxv','cvcxv',NULL,'2025-09-09 09:18:57','2025-09-09 09:20:56',NULL,0,0),(32,'S19AL007',19,NULL,'fdgfg','dfgfg',21,'fgfg',NULL,'gffg',NULL,'fgfg','open',1,NULL,'medium',0,'fgfg','fg',NULL,'2025-09-09 09:22:23','2025-09-09 09:38:53',NULL,0,0),(33,'S19AL008',19,NULL,'retgrtre','ertrter',20,'rett',NULL,'trtr',NULL,'rtrt','open',1,NULL,'medium',0,'retretrtretrt','rt',NULL,'2025-09-09 09:23:59','2025-09-09 09:38:53',NULL,0,0),(34,'S19AL009',19,NULL,'fgbfg','fgfg',19,'fgfg',NULL,'fgfg',NULL,'fgfg','open',1,NULL,'medium',0,'fgfdg','fgfd',NULL,'2025-09-09 09:30:00','2025-09-09 09:38:53',NULL,0,0),(35,'S19AL010',19,NULL,'ffsd','sdfdsf',16,'dfdfsd',NULL,'dfdsf',NULL,'fdfsdf','open',1,NULL,'medium',0,'dfdfdff','dsfdf',NULL,'2025-09-09 09:40:52','2025-09-09 09:40:52',NULL,0,0),(36,'S19AL011',19,NULL,'vbxcb','cvbvb',18,'fgfg',NULL,'rakes',NULL,'ffgg','open',1,NULL,'medium',0,'fgfg','fgfg',NULL,'2025-09-09 09:41:46','2025-09-09 09:41:46',NULL,0,0);
/*!40000 ALTER TABLE `queries` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `query_created_trigger` AFTER INSERT ON `queries` FOR EACH ROW BEGIN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.student_id, 'query_created', 'query', NEW.id, 
            JSON_OBJECT('title', NEW.title, 'status', NEW.status));
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `query_status_change_trigger` AFTER UPDATE ON `queries` FOR EACH ROW BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
        VALUES (NEW.expert_reviewer_id, 'status_changed', 'query', NEW.id, 
                JSON_OBJECT('old_status', OLD.status, 'new_status', NEW.status));
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `add_expert_to_chat_on_assignment` AFTER UPDATE ON `queries` FOR EACH ROW BEGIN
    
    IF OLD.expert_reviewer_id IS NULL AND NEW.expert_reviewer_id IS NOT NULL AND NEW.chat_enabled = TRUE THEN
        
        SET @chat_id = (SELECT id FROM query_chats WHERE query_id = NEW.id);
        
        
        IF @chat_id IS NOT NULL THEN
            INSERT IGNORE INTO chat_participants (chat_id, user_id, role)
            VALUES (@chat_id, NEW.expert_reviewer_id, 'expert');
        END IF;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `query_assignments`
--

DROP TABLE IF EXISTS `query_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `query_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `query_id` int NOT NULL,
  `expert_reviewer_id` int NOT NULL,
  `assigned_by` int NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('assigned','accepted','rejected','completed') DEFAULT 'assigned',
  `notes` text,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_query_assignment` (`query_id`),
  KEY `idx_assignments_query` (`query_id`),
  KEY `idx_assignments_expert` (`expert_reviewer_id`),
  KEY `idx_assignments_assigner` (`assigned_by`),
  KEY `idx_assignments_status` (`status`),
  KEY `idx_assignments_assigned` (`assigned_at`),
  CONSTRAINT `query_assignments_ibfk_1` FOREIGN KEY (`query_id`) REFERENCES `queries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `query_assignments_ibfk_2` FOREIGN KEY (`expert_reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `query_assignments_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `query_assignments`
--

LOCK TABLES `query_assignments` WRITE;
/*!40000 ALTER TABLE `query_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `query_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `query_chats`
--

DROP TABLE IF EXISTS `query_chats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `query_chats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `query_id` int NOT NULL,
  `chat_status` enum('active','resolved','closed') DEFAULT 'active',
  `last_message_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `query_id` (`query_id`),
  KEY `idx_query_chats_query` (`query_id`),
  KEY `idx_query_chats_status` (`chat_status`),
  KEY `idx_query_chats_last_message` (`last_message_at`),
  CONSTRAINT `query_chats_ibfk_1` FOREIGN KEY (`query_id`) REFERENCES `queries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `query_chats`
--

LOCK TABLES `query_chats` WRITE;
/*!40000 ALTER TABLE `query_chats` DISABLE KEYS */;
/*!40000 ALTER TABLE `query_chats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `query_comments`
--

DROP TABLE IF EXISTS `query_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `query_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `query_id` int NOT NULL,
  `user_id` int NOT NULL,
  `parent_comment_id` int DEFAULT NULL,
  `content` text NOT NULL,
  `is_internal` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comments_query` (`query_id`),
  KEY `idx_comments_user` (`user_id`),
  KEY `idx_comments_parent` (`parent_comment_id`),
  KEY `idx_comments_internal` (`is_internal`),
  KEY `idx_comments_created` (`created_at`),
  CONSTRAINT `query_comments_ibfk_1` FOREIGN KEY (`query_id`) REFERENCES `queries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `query_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `query_comments_ibfk_3` FOREIGN KEY (`parent_comment_id`) REFERENCES `query_comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `query_comments`
--

LOCK TABLES `query_comments` WRITE;
/*!40000 ALTER TABLE `query_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `query_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `query_details_view`
--

DROP TABLE IF EXISTS `query_details_view`;
/*!50001 DROP VIEW IF EXISTS `query_details_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `query_details_view` AS SELECT 
 1 AS `id`,
 1 AS `custom_query_id`,
 1 AS `title`,
 1 AS `description`,
 1 AS `status`,
 1 AS `priority`,
 1 AS `resolution_attempts`,
 1 AS `resolution`,
 1 AS `debug_steps`,
 1 AS `tags`,
 1 AS `created_at`,
 1 AS `updated_at`,
 1 AS `resolved_at`,
 1 AS `student_name`,
 1 AS `student_username`,
 1 AS `student_email`,
 1 AS `expert_name`,
 1 AS `expert_username`,
 1 AS `domain_name`,
 1 AS `stage_name`,
 1 AS `stage_order`,
 1 AS `tool_name`,
 1 AS `tool_vendor`,
 1 AS `technology_name`,
 1 AS `issue_category_name`,
 1 AS `issue_severity`,
 1 AS `response_count`,
 1 AS `image_count`,
 1 AS `comment_count`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `query_edit_history`
--

DROP TABLE IF EXISTS `query_edit_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `query_edit_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `query_id` int NOT NULL,
  `editor_id` int NOT NULL,
  `editor_role` enum('student','professional','expert_reviewer','admin') NOT NULL,
  `field_name` varchar(100) NOT NULL,
  `old_value` text,
  `new_value` text,
  `edit_type` enum('create','update','delete') DEFAULT 'update',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_query_edit_history_query_id` (`query_id`),
  KEY `idx_query_edit_history_editor_id` (`editor_id`),
  KEY `idx_query_edit_history_created_at` (`created_at`),
  CONSTRAINT `query_edit_history_ibfk_1` FOREIGN KEY (`query_id`) REFERENCES `queries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `query_edit_history_ibfk_2` FOREIGN KEY (`editor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `query_edit_history`
--

LOCK TABLES `query_edit_history` WRITE;
/*!40000 ALTER TABLE `query_edit_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `query_edit_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `query_images`
--

DROP TABLE IF EXISTS `query_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `query_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `query_id` int NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_query_images_query` (`query_id`),
  KEY `idx_query_images_filename` (`filename`),
  KEY `idx_query_images_mime` (`mime_type`),
  CONSTRAINT `query_images_ibfk_1` FOREIGN KEY (`query_id`) REFERENCES `queries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `query_images`
--

LOCK TABLES `query_images` WRITE;
/*!40000 ALTER TABLE `query_images` DISABLE KEYS */;
INSERT INTO `query_images` VALUES (4,29,'query-1757400261428-799120239.png','Gemini_Generated_Image_v2ln8iv2ln8iv2ln.png','C:\\Users\\2020r\\vlsiportal\\backend\\uploads\\query-1757400261428-799120239.png',1140540,'image/png',NULL,'2025-09-09 06:44:21'),(5,30,'query-1757401544723-364052904.png','Gemini_Generated_Image_v2ln8iv2ln8iv2ln.png','C:\\Users\\2020r\\vlsiportal\\backend\\uploads\\query-1757401544723-364052904.png',1140540,'image/png',NULL,'2025-09-09 07:05:44');
/*!40000 ALTER TABLE `query_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `responses`
--

DROP TABLE IF EXISTS `responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `responses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `query_id` int NOT NULL,
  `responder_id` int NOT NULL,
  `response_type` enum('answer','clarification','follow_up','resolution') DEFAULT 'answer',
  `content` text NOT NULL,
  `is_solution` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_responses_query` (`query_id`),
  KEY `idx_responses_responder` (`responder_id`),
  KEY `idx_responses_type` (`response_type`),
  KEY `idx_responses_solution` (`is_solution`),
  KEY `idx_responses_created` (`created_at`),
  CONSTRAINT `responses_ibfk_1` FOREIGN KEY (`query_id`) REFERENCES `queries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `responses_ibfk_2` FOREIGN KEY (`responder_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `responses`
--

LOCK TABLES `responses` WRITE;
/*!40000 ALTER TABLE `responses` DISABLE KEYS */;
INSERT INTO `responses` VALUES (8,29,1,'answer','ffgfgfg',0,'2025-09-09 06:44:40','2025-09-09 06:44:40'),(9,29,1,'answer','fgfgfgfgfgg',0,'2025-09-09 06:45:05','2025-09-09 06:45:05'),(10,29,1,'answer','vbvbvb',0,'2025-09-09 06:45:19','2025-09-09 06:45:19'),(13,30,1,'answer','ghjghjgjgjh',0,'2025-09-09 07:05:55','2025-09-09 07:05:55');
/*!40000 ALTER TABLE `responses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stages`
--

DROP TABLE IF EXISTS `stages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `domain_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `order_sequence` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_stage_domain` (`name`,`domain_id`),
  KEY `idx_stages_domain` (`domain_id`),
  KEY `idx_stages_name` (`name`),
  KEY `idx_stages_order` (`order_sequence`),
  KEY `idx_stages_active` (`is_active`),
  CONSTRAINT `stages_ibfk_1` FOREIGN KEY (`domain_id`) REFERENCES `domains` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stages`
--

LOCK TABLES `stages` WRITE;
/*!40000 ALTER TABLE `stages` DISABLE KEYS */;
INSERT INTO `stages` VALUES (1,1,'Synthesis','Logic synthesis and optimization',1,1,'2025-09-05 06:10:49'),(2,1,'Design Initialization','Design initialization and setup',2,1,'2025-09-05 06:10:49'),(3,1,'Floorplan','Floorplanning and macro placement',3,1,'2025-09-05 06:10:49'),(4,1,'Placement','Cell placement and optimization',4,1,'2025-09-05 06:10:49'),(5,1,'CTS','Clock tree synthesis',5,1,'2025-09-05 06:10:49'),(6,1,'Post CTS Optimization','Post clock tree synthesis optimization',6,1,'2025-09-05 06:10:49'),(7,1,'Routing','Signal routing',7,1,'2025-09-05 06:10:49'),(8,1,'Post Route Optimization','Post routing optimization',8,1,'2025-09-05 06:10:49'),(9,1,'Filler Insertion','Filler cell insertion',9,1,'2025-09-05 06:10:49'),(10,1,'PD Outputs','Physical design outputs',10,1,'2025-09-05 06:10:49'),(11,1,'RC Extraction','RC parasitic extraction',11,1,'2025-09-05 06:10:49'),(12,1,'ECO','Engineering change order',12,1,'2025-09-05 06:10:49'),(13,1,'STA','Static timing analysis',13,1,'2025-09-05 06:10:49'),(14,1,'EMIR','Electromigration and IR drop analysis',14,1,'2025-09-05 06:10:49'),(15,1,'Physical Verification','Physical design verification',15,1,'2025-09-05 06:10:49'),(16,1,'CLP','Clock level power analysis',16,1,'2025-09-05 06:10:49'),(17,1,'LEC','Logic equivalence checking',17,1,'2025-09-05 06:10:49'),(18,2,'Schematic Design Inputs','Schematic design input requirements and specifications',1,1,'2025-09-05 06:10:49'),(19,2,'Floorplan','Floorplanning and device placement for analog layout',2,1,'2025-09-05 06:10:49'),(20,2,'Routing','Analog signal routing and interconnect',3,1,'2025-09-05 06:10:49'),(21,2,'AL Outputs','Analog layout output files and deliverables',4,1,'2025-09-05 06:10:49'),(22,2,'RC Extraction','RC parasitic extraction for analog circuits',5,1,'2025-09-05 06:10:49'),(23,2,'ECO','Engineering change orders for analog layout',6,1,'2025-09-05 06:10:49'),(24,2,'EMIR','Electromigration and IR drop analysis for analog',7,1,'2025-09-05 06:10:49'),(25,2,'Physical Verification','Physical verification for analog layout',8,1,'2025-09-05 06:10:49'),(26,2,'ESD','ESD protection and design',9,1,'2025-09-05 06:10:49'),(27,2,'Pads','Bond pads and probe pads design',10,1,'2025-09-05 06:10:49'),(28,2,'Package','Package design and integration',11,1,'2025-09-05 06:10:49'),(29,2,'Technology & PDKs','Technology files and PDK management',12,1,'2025-09-05 06:10:49'),(30,2,'DB Version Control','Database version control and management',13,1,'2025-09-05 06:10:49'),(31,2,'Project Release & QA','Project release and quality assurance',14,1,'2025-09-05 06:10:49');
/*!40000 ALTER TABLE `stages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tools`
--

DROP TABLE IF EXISTS `tools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tools` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `vendor` varchar(50) DEFAULT NULL,
  `category` enum('synthesis','place_route','verification','simulation','analysis','other') DEFAULT 'other',
  `domain_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tool_domain` (`name`,`domain_id`),
  KEY `idx_tools_name` (`name`),
  KEY `idx_tools_vendor` (`vendor`),
  KEY `idx_tools_category` (`category`),
  KEY `idx_tools_domain` (`domain_id`),
  KEY `idx_tools_active` (`is_active`),
  CONSTRAINT `tools_ibfk_1` FOREIGN KEY (`domain_id`) REFERENCES `domains` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tools`
--

LOCK TABLES `tools` WRITE;
/*!40000 ALTER TABLE `tools` DISABLE KEYS */;
INSERT INTO `tools` VALUES (1,'Design Compiler','Synopsys Design Compiler for synthesis','Synopsys','synthesis',1,1,'2025-09-05 06:10:49'),(2,'Genus','Cadence Genus Synthesis Solution','Cadence','synthesis',1,1,'2025-09-05 06:10:49'),(3,'Fusion Compiler','Synopsys Fusion Compiler for design implementation','Synopsys','synthesis',1,1,'2025-09-05 06:10:49'),(4,'Innovus','Cadence Innovus Implementation System','Cadence','place_route',1,1,'2025-09-05 06:10:49'),(5,'ICC2','Synopsys IC Compiler II for place and route','Synopsys','place_route',1,1,'2025-09-05 06:10:49'),(6,'PrimeTime','Synopsys PrimeTime for timing analysis','Synopsys','analysis',1,1,'2025-09-05 06:10:49'),(7,'Tempus','Cadence Tempus Timing Signoff Solution','Cadence','analysis',1,1,'2025-09-05 06:10:49'),(8,'StarRC','Synopsys StarRC for parasitic extraction','Synopsys','analysis',1,1,'2025-09-05 06:10:49'),(9,'Quantus','Cadence Quantus Extraction Solution','Cadence','analysis',1,1,'2025-09-05 06:10:49'),(10,'Redhawk','Ansys Redhawk for power analysis','Ansys','analysis',1,1,'2025-09-05 06:10:49'),(11,'Voltus','Cadence Voltus IC Power Integrity Solution','Cadence','analysis',1,1,'2025-09-05 06:10:49'),(12,'Pegasus','Synopsys Pegasus Verification System','Synopsys','verification',1,1,'2025-09-05 06:10:49'),(13,'Calibre','Mentor Graphics Calibre for DRC/LVS','Mentor','verification',1,1,'2025-09-05 06:10:49'),(14,'IC Validator','Synopsys IC Validator for physical verification','Synopsys','verification',1,1,'2025-09-05 06:10:49'),(15,'Virtuoso','Cadence Virtuoso for analog design','Cadence','place_route',2,1,'2025-09-05 06:10:49'),(16,'Custom Compiler','Synopsys Custom Compiler for analog layout design','Synopsys','place_route',2,1,'2025-09-05 06:10:49'),(17,'Calibre','Mentor Graphics Calibre for DRC/LVS verification in analog layout','Mentor','verification',2,1,'2025-09-05 06:10:49'),(18,'IC Validator','Synopsys IC Validator for physical verification in analog layout','Synopsys','verification',2,1,'2025-09-05 06:10:49'),(19,'Pegasus','Synopsys Pegasus Verification System for analog layout verification','Synopsys','verification',2,1,'2025-09-05 06:10:49'),(20,'Redhawk','Synopsys Redhawk for power analysis and IR drop analysis in analog layout','Synopsys','analysis',2,1,'2025-09-05 06:10:49'),(21,'StarRC','Synopsys StarRC for parasitic extraction in analog layout','Synopsys','analysis',2,1,'2025-09-05 06:10:49'),(22,'Quantus','Cadence Quantus for parasitic extraction and analysis in analog layout','Cadence','analysis',2,1,'2025-09-05 06:10:49'),(23,'ModelSim','Mentor Graphics ModelSim for simulation','Mentor','simulation',3,1,'2025-09-05 06:10:49'),(24,'VCS','Synopsys VCS for simulation','Synopsys','simulation',3,1,'2025-09-05 06:10:49'),(25,'Questa','Mentor Graphics Questa for simulation','Mentor','simulation',3,1,'2025-09-05 06:10:49'),(26,'Verdi','Synopsys Verdi for debugging','Synopsys','analysis',3,1,'2025-09-05 06:10:49');
/*!40000 ALTER TABLE `tools` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_preferences`
--

DROP TABLE IF EXISTS `user_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `preference_key` varchar(100) NOT NULL,
  `preference_value` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_preference` (`user_id`,`preference_key`),
  KEY `idx_preferences_user` (`user_id`),
  KEY `idx_preferences_key` (`preference_key`),
  CONSTRAINT `user_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_preferences`
--

LOCK TABLES `user_preferences` WRITE;
/*!40000 ALTER TABLE `user_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `role` enum('student','expert_reviewer','admin','professional') NOT NULL,
  `domain_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_username` (`username`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_domain` (`domain_id`),
  KEY `idx_users_active` (`is_active`),
  KEY `idx_users_last_login` (`last_login`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`domain_id`) REFERENCES `domains` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin@vlsiportal.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','System Administrator','admin',NULL,1,NULL,'2025-09-05 06:10:49','2025-09-05 06:10:49'),(12,'ravichakka',NULL,'$2a$10$8MloGmD/VzOlH80NM3hi7.MhS.Y.BjpVAtgiyFQB08GeHUZotKl9q','ravichakka','admin',NULL,1,NULL,'2025-09-05 12:17:26','2025-09-05 12:17:26'),(13,'bharath',NULL,'$2a$10$sqyg4Ck9tUkHFQebVElfGeawX.cxv5rz4C8F/fQkf7Yjdczuqufja','bharath kumar ','admin',NULL,1,NULL,'2025-09-05 12:17:57','2025-09-05 12:17:57'),(14,'srikanth ',NULL,'$2a$10$p3yXYveyEgnSa6tdRjOCUuimdJMAQGKPNGoT8bJrj0FSr3amu576u','srikanth Anumalashetty','admin',NULL,1,NULL,'2025-09-05 12:18:43','2025-09-05 12:18:43'),(15,'sashikanth',NULL,'$2a$10$HkZo4jDEdQTHztajDqHd0O3Dc/QzOyEvV.8/fbttKLC03K/IRF8.S','sashikanth','admin',NULL,1,NULL,'2025-09-05 12:20:27','2025-09-05 12:20:27'),(16,'shabbir',NULL,'$2a$10$cORJXTXbC7XehzVJ8PJhJOB5fKkWDL5ZyP6.Y4mXhdkXuqnt1cWmG','shaik hassan shabbir','admin',NULL,1,NULL,'2025-09-05 12:21:35','2025-09-05 12:21:35'),(17,'bharathr',NULL,'$2a$10$K5GLNUaw.HeBoH6.MWSLD.EG9V.Ev7UXZnSLfgCWAUxEFRNyZqnUi','bharath','admin',NULL,1,NULL,'2025-09-05 12:36:45','2025-09-05 12:36:45'),(18,'Srikanth',NULL,'$2a$10$FUvGwMjTtfrvKM.UusHk9.d5LaFU4w7eW2odBz8qtvkhTVCyYqvVK','srikanth','admin',NULL,1,NULL,'2025-09-05 12:39:45','2025-09-05 12:39:45'),(19,'Rakesh',NULL,'$2a$10$bhe/4ahXG1n16ocJgy0tLe.OBfRDSrOGX6aSnTRpawENYU7ID/KJC','Rakesh','student',2,1,NULL,'2025-09-08 10:03:42','2025-09-08 10:03:42');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `domain_stats_view`
--

/*!50001 DROP VIEW IF EXISTS `domain_stats_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `domain_stats_view` AS select `d`.`id` AS `domain_id`,`d`.`name` AS `domain_name`,`d`.`description` AS `domain_description`,count(distinct `u`.`id`) AS `total_users`,count(distinct (case when (`u`.`role` = 'student') then `u`.`id` end)) AS `student_count`,count(distinct (case when (`u`.`role` = 'expert_reviewer') then `u`.`id` end)) AS `expert_reviewer_count`,count(distinct (case when (`u`.`role` = 'professional') then `u`.`id` end)) AS `professional_count`,count(distinct `q`.`id`) AS `total_queries`,count(distinct (case when (`q`.`status` = 'open') then `q`.`id` end)) AS `open_queries`,count(distinct (case when (`q`.`status` = 'in_progress') then `q`.`id` end)) AS `in_progress_queries`,count(distinct (case when (`q`.`status` = 'resolved') then `q`.`id` end)) AS `resolved_queries`,count(distinct (case when (`q`.`status` = 'closed') then `q`.`id` end)) AS `closed_queries`,count(distinct (case when (`q`.`priority` = 'urgent') then `q`.`id` end)) AS `urgent_queries`,count(distinct (case when (`q`.`priority` = 'high') then `q`.`id` end)) AS `high_priority_queries`,count(distinct (case when (`q`.`priority` = 'medium') then `q`.`id` end)) AS `medium_priority_queries`,count(distinct (case when (`q`.`priority` = 'low') then `q`.`id` end)) AS `low_priority_queries`,avg((case when ((`q`.`resolved_at` is not null) and (`q`.`created_at` is not null)) then (to_days(`q`.`resolved_at`) - to_days(`q`.`created_at`)) else NULL end)) AS `avg_resolution_days` from ((`domains` `d` left join `users` `u` on((`d`.`id` = `u`.`domain_id`))) left join `queries` `q` on((`u`.`id` = `q`.`student_id`))) group by `d`.`id`,`d`.`name`,`d`.`description` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `expert_workload_view`
--

/*!50001 DROP VIEW IF EXISTS `expert_workload_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `expert_workload_view` AS select `u`.`id` AS `expert_id`,`u`.`full_name` AS `expert_name`,`u`.`username` AS `expert_username`,`d`.`name` AS `domain_name`,count(distinct `qa`.`id`) AS `total_assignments`,count(distinct (case when (`qa`.`status` = 'assigned') then `qa`.`id` end)) AS `pending_assignments`,count(distinct (case when (`qa`.`status` = 'accepted') then `qa`.`id` end)) AS `accepted_assignments`,count(distinct (case when (`qa`.`status` = 'completed') then `qa`.`id` end)) AS `completed_assignments`,count(distinct `q`.`id`) AS `total_queries`,count(distinct (case when (`q`.`status` = 'open') then `q`.`id` end)) AS `open_queries`,count(distinct (case when (`q`.`status` = 'in_progress') then `q`.`id` end)) AS `in_progress_queries`,count(distinct (case when (`q`.`status` = 'resolved') then `q`.`id` end)) AS `resolved_queries`,count(distinct `r`.`id`) AS `total_responses`,count(distinct (case when (`r`.`is_solution` = true) then `r`.`id` end)) AS `solution_responses` from ((((`users` `u` left join `domains` `d` on((`u`.`domain_id` = `d`.`id`))) left join `query_assignments` `qa` on((`u`.`id` = `qa`.`expert_reviewer_id`))) left join `queries` `q` on((`u`.`id` = `q`.`expert_reviewer_id`))) left join `responses` `r` on((`u`.`id` = `r`.`responder_id`))) where (`u`.`role` = 'expert_reviewer') group by `u`.`id`,`u`.`full_name`,`u`.`username`,`d`.`name` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `query_details_view`
--

/*!50001 DROP VIEW IF EXISTS `query_details_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `query_details_view` AS select `q`.`id` AS `id`,`q`.`custom_query_id` AS `custom_query_id`,`q`.`title` AS `title`,`q`.`description` AS `description`,`q`.`status` AS `status`,`q`.`priority` AS `priority`,`q`.`resolution_attempts` AS `resolution_attempts`,`q`.`resolution` AS `resolution`,`q`.`debug_steps` AS `debug_steps`,`q`.`tags` AS `tags`,`q`.`created_at` AS `created_at`,`q`.`updated_at` AS `updated_at`,`q`.`resolved_at` AS `resolved_at`,`u`.`full_name` AS `student_name`,`u`.`username` AS `student_username`,`u`.`email` AS `student_email`,`e`.`full_name` AS `expert_name`,`e`.`username` AS `expert_username`,`d`.`name` AS `domain_name`,`s`.`name` AS `stage_name`,`s`.`order_sequence` AS `stage_order`,`t`.`name` AS `tool_name`,`t`.`vendor` AS `tool_vendor`,`q`.`technology` AS `technology_name`,coalesce(`ic`.`name`,`q`.`custom_issue_category`) AS `issue_category_name`,`ic`.`severity` AS `issue_severity`,(select count(0) from `responses` `r` where (`r`.`query_id` = `q`.`id`)) AS `response_count`,(select count(0) from `query_images` `qi` where (`qi`.`query_id` = `q`.`id`)) AS `image_count`,(select count(0) from `query_comments` `qc` where (`qc`.`query_id` = `q`.`id`)) AS `comment_count` from ((((((`queries` `q` left join `users` `u` on((`q`.`student_id` = `u`.`id`))) left join `users` `e` on((`q`.`expert_reviewer_id` = `e`.`id`))) left join `domains` `d` on((`u`.`domain_id` = `d`.`id`))) left join `stages` `s` on((`q`.`stage_id` = `s`.`id`))) left join `tools` `t` on((`q`.`tool_id` = `t`.`id`))) left join `issue_categories` `ic` on((`q`.`issue_category_id` = `ic`.`id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-09 15:29:29
