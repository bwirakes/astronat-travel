import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TYPE "payload"."enum_pages_blocks_hero_section_decorative_element" AS ENUM('none', 'orbital-grid', 'rotating-svg');
  CREATE TYPE "payload"."enum_pages_blocks_hero_section_layout" AS ENUM('image-right', 'text-only');
  CREATE TYPE "payload"."enum_pages_blocks_statement_band_variant" AS ENUM('statement', 'disclaimer');
  CREATE TYPE "payload"."enum_pages_blocks_card_grid_variant" AS ENUM('numbered', 'pricing');
  CREATE TYPE "payload"."enum_pages_blocks_card_grid_section_bg" AS ENUM('raised', 'charcoal', 'bg');
  CREATE TYPE "payload"."enum_pages_blocks_split_content_layout" AS ENUM('standard', 'methodology', 'two-column-text');
  CREATE TYPE "payload"."enum_pages_blocks_split_content_image_side" AS ENUM('left', 'right');
  CREATE TYPE "payload"."enum_pages_blocks_cta_band_layout" AS ENUM('standard', 'newsletter', 'cta-cards', 'centered', 'two-column');
  CREATE TYPE "payload"."enum_pages_blocks_cta_band_decorative_element" AS ENUM('none', 'rotating-svg');
  CREATE TYPE "payload"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__pages_v_blocks_hero_section_decorative_element" AS ENUM('none', 'orbital-grid', 'rotating-svg');
  CREATE TYPE "payload"."enum__pages_v_blocks_hero_section_layout" AS ENUM('image-right', 'text-only');
  CREATE TYPE "payload"."enum__pages_v_blocks_statement_band_variant" AS ENUM('statement', 'disclaimer');
  CREATE TYPE "payload"."enum__pages_v_blocks_card_grid_variant" AS ENUM('numbered', 'pricing');
  CREATE TYPE "payload"."enum__pages_v_blocks_card_grid_section_bg" AS ENUM('raised', 'charcoal', 'bg');
  CREATE TYPE "payload"."enum__pages_v_blocks_split_content_layout" AS ENUM('standard', 'methodology', 'two-column-text');
  CREATE TYPE "payload"."enum__pages_v_blocks_split_content_image_side" AS ENUM('left', 'right');
  CREATE TYPE "payload"."enum__pages_v_blocks_cta_band_layout" AS ENUM('standard', 'newsletter', 'cta-cards', 'centered', 'two-column');
  CREATE TYPE "payload"."enum__pages_v_blocks_cta_band_decorative_element" AS ENUM('none', 'rotating-svg');
  CREATE TYPE "payload"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "payload"."enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_hero_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar,
  	"kicker_color" varchar DEFAULT 'y2k-blue',
  	"title_accent" varchar,
  	"title_html" varchar,
  	"subtitle" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_href" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_href" varchar,
  	"hero_image_id" integer,
  	"decorative_element" "payload"."enum_pages_blocks_hero_section_decorative_element",
  	"layout" "payload"."enum_pages_blocks_hero_section_layout",
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_stats_strip_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"n" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_stats_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"columns" numeric DEFAULT 4,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_statement_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "payload"."enum_pages_blocks_statement_band_variant" DEFAULT 'statement',
  	"kicker" varchar,
  	"body_html" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_card_grid_cards_includes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"line" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_card_grid_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"num" varchar,
  	"title" varchar,
  	"desc" varchar,
  	"tag" varchar,
  	"glyph" varchar,
  	"bg_token" varchar,
  	"text_token" varchar,
  	"tier" varchar,
  	"tagline" varchar,
  	"price" varchar,
  	"primary" boolean,
  	"cta_label" varchar,
  	"cta_href" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_card_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"heading_html" varchar,
  	"kicker" varchar,
  	"variant" "payload"."enum_pages_blocks_card_grid_variant" DEFAULT 'numbered',
  	"columns" numeric DEFAULT 2,
  	"section_bg" "payload"."enum_pages_blocks_card_grid_section_bg" DEFAULT 'bg',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_split_content_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar,
  	"title" varchar,
  	"desc" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_split_content_numbered_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"glyph" varchar,
  	"title" varchar,
  	"desc" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_split_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"layout" "payload"."enum_pages_blocks_split_content_layout" DEFAULT 'standard',
  	"bg_token" varchar,
  	"kicker" varchar,
  	"heading" varchar,
  	"heading_html" varchar,
  	"body" varchar,
  	"body2" varchar,
  	"image_id" integer,
  	"image_side" "payload"."enum_pages_blocks_split_content_image_side" DEFAULT 'right',
  	"primary_cta_label" varchar,
  	"primary_cta_href" varchar,
  	"right_panel_kicker" varchar,
  	"right_panel_price_line" varchar,
  	"right_panel_price_note" varchar,
  	"right_panel_limit_note" varchar,
  	"right_panel_cta_label" varchar,
  	"right_panel_cta_href" varchar,
  	"right_panel_testimonial_kicker" varchar,
  	"right_panel_testimonial_meta" varchar,
  	"left_col_title" varchar,
  	"left_col_body" varchar,
  	"right_col_title" varchar,
  	"right_col_body" varchar,
  	"monogram_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_process_timeline_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"n" varchar,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_process_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar,
  	"heading_html" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_cta_band_perks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"line" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_cta_band_secondary_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar,
  	"title_html" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_cta_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"layout" "payload"."enum_pages_blocks_cta_band_layout" DEFAULT 'standard',
  	"bg_token" varchar,
  	"accent" varchar,
  	"heading" varchar,
  	"heading_html" varchar,
  	"body" varchar,
  	"title_line1" varchar,
  	"title_line2" varchar,
  	"newsletter_body" varchar,
  	"price_line" varchar,
  	"closing" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_href" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_href" varchar,
  	"primary_card_kicker" varchar,
  	"primary_card_title_html" varchar,
  	"primary_card_href" varchar,
  	"decorative_element" "payload"."enum_pages_blocks_cta_band_decorative_element" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_ticker_marquee_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_ticker_marquee" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"duration_sec" numeric DEFAULT 28,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_testimonial_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"quote" varchar,
  	"name" varchar,
  	"location" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_testimonial_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_faq_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_faq_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"kicker" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_geo_map_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"section_label" varchar,
  	"intro" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_geo_mundane_cycles_cycles" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"sym" varchar,
  	"title" varchar,
  	"desc" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_geo_mundane_cycles_research_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"loc" varchar,
  	"desc" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_geo_mundane_cycles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"section_label" varchar,
  	"banner_kicker" varchar,
  	"banner_title_accent" varchar,
  	"banner_title" varchar,
  	"banner_body" varchar,
  	"research_cta_label" varchar,
  	"research_cta_href" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_geo_case_studies_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"meta_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_hero_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kicker" varchar,
  	"kicker_color" varchar DEFAULT 'y2k-blue',
  	"title_accent" varchar,
  	"title_html" varchar,
  	"subtitle" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_href" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_href" varchar,
  	"hero_image_id" integer,
  	"decorative_element" "payload"."enum__pages_v_blocks_hero_section_decorative_element",
  	"layout" "payload"."enum__pages_v_blocks_hero_section_layout",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_stats_strip_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"n" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_stats_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"columns" numeric DEFAULT 4,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_statement_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "payload"."enum__pages_v_blocks_statement_band_variant" DEFAULT 'statement',
  	"kicker" varchar,
  	"body_html" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_card_grid_cards_includes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"line" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_card_grid_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"num" varchar,
  	"title" varchar,
  	"desc" varchar,
  	"tag" varchar,
  	"glyph" varchar,
  	"bg_token" varchar,
  	"text_token" varchar,
  	"tier" varchar,
  	"tagline" varchar,
  	"price" varchar,
  	"primary" boolean,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_card_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"heading_html" varchar,
  	"kicker" varchar,
  	"variant" "payload"."enum__pages_v_blocks_card_grid_variant" DEFAULT 'numbered',
  	"columns" numeric DEFAULT 2,
  	"section_bg" "payload"."enum__pages_v_blocks_card_grid_section_bg" DEFAULT 'bg',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_split_content_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" varchar,
  	"title" varchar,
  	"desc" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_split_content_numbered_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"glyph" varchar,
  	"title" varchar,
  	"desc" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_split_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"layout" "payload"."enum__pages_v_blocks_split_content_layout" DEFAULT 'standard',
  	"bg_token" varchar,
  	"kicker" varchar,
  	"heading" varchar,
  	"heading_html" varchar,
  	"body" varchar,
  	"body2" varchar,
  	"image_id" integer,
  	"image_side" "payload"."enum__pages_v_blocks_split_content_image_side" DEFAULT 'right',
  	"primary_cta_label" varchar,
  	"primary_cta_href" varchar,
  	"right_panel_kicker" varchar,
  	"right_panel_price_line" varchar,
  	"right_panel_price_note" varchar,
  	"right_panel_limit_note" varchar,
  	"right_panel_cta_label" varchar,
  	"right_panel_cta_href" varchar,
  	"right_panel_testimonial_kicker" varchar,
  	"right_panel_testimonial_meta" varchar,
  	"left_col_title" varchar,
  	"left_col_body" varchar,
  	"right_col_title" varchar,
  	"right_col_body" varchar,
  	"monogram_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_process_timeline_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"n" varchar,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_process_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kicker" varchar,
  	"heading_html" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_cta_band_perks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"line" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_cta_band_secondary_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kicker" varchar,
  	"title_html" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_cta_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"layout" "payload"."enum__pages_v_blocks_cta_band_layout" DEFAULT 'standard',
  	"bg_token" varchar,
  	"accent" varchar,
  	"heading" varchar,
  	"heading_html" varchar,
  	"body" varchar,
  	"title_line1" varchar,
  	"title_line2" varchar,
  	"newsletter_body" varchar,
  	"price_line" varchar,
  	"closing" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_href" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_href" varchar,
  	"primary_card_kicker" varchar,
  	"primary_card_title_html" varchar,
  	"primary_card_href" varchar,
  	"decorative_element" "payload"."enum__pages_v_blocks_cta_band_decorative_element" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_ticker_marquee_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_ticker_marquee" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"duration_sec" numeric DEFAULT 28,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_testimonial_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote" varchar,
  	"name" varchar,
  	"location" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_testimonial_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_faq_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_faq_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"kicker" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_geo_map_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"section_label" varchar,
  	"intro" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_geo_mundane_cycles_cycles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"sym" varchar,
  	"title" varchar,
  	"desc" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_geo_mundane_cycles_research_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"loc" varchar,
  	"desc" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_geo_mundane_cycles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"section_label" varchar,
  	"banner_kicker" varchar,
  	"banner_title_accent" varchar,
  	"banner_title" varchar,
  	"banner_body" varchar,
  	"research_cta_label" varchar,
  	"research_cta_href" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_geo_case_studies_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_meta_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"pages_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_hero_section" ADD CONSTRAINT "pages_blocks_hero_section_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_hero_section" ADD CONSTRAINT "pages_blocks_hero_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_stats_strip_stats" ADD CONSTRAINT "pages_blocks_stats_strip_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_stats_strip"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_stats_strip" ADD CONSTRAINT "pages_blocks_stats_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_statement_band" ADD CONSTRAINT "pages_blocks_statement_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_card_grid_cards_includes" ADD CONSTRAINT "pages_blocks_card_grid_cards_includes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_card_grid_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_card_grid_cards" ADD CONSTRAINT "pages_blocks_card_grid_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_card_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_card_grid" ADD CONSTRAINT "pages_blocks_card_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_split_content_features" ADD CONSTRAINT "pages_blocks_split_content_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_split_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_split_content_numbered_items" ADD CONSTRAINT "pages_blocks_split_content_numbered_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_split_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_split_content" ADD CONSTRAINT "pages_blocks_split_content_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_split_content" ADD CONSTRAINT "pages_blocks_split_content_monogram_id_media_id_fk" FOREIGN KEY ("monogram_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_split_content" ADD CONSTRAINT "pages_blocks_split_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_process_timeline_steps" ADD CONSTRAINT "pages_blocks_process_timeline_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_process_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_process_timeline" ADD CONSTRAINT "pages_blocks_process_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_cta_band_perks" ADD CONSTRAINT "pages_blocks_cta_band_perks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_cta_band"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_cta_band_secondary_cards" ADD CONSTRAINT "pages_blocks_cta_band_secondary_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_cta_band"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_cta_band" ADD CONSTRAINT "pages_blocks_cta_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_ticker_marquee_items" ADD CONSTRAINT "pages_blocks_ticker_marquee_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_ticker_marquee"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_ticker_marquee" ADD CONSTRAINT "pages_blocks_ticker_marquee_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_testimonial_grid_items" ADD CONSTRAINT "pages_blocks_testimonial_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_testimonial_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_testimonial_grid" ADD CONSTRAINT "pages_blocks_testimonial_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_faq_accordion_items" ADD CONSTRAINT "pages_blocks_faq_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_faq_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_faq_accordion" ADD CONSTRAINT "pages_blocks_faq_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_geo_map_section" ADD CONSTRAINT "pages_blocks_geo_map_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_geo_mundane_cycles_cycles" ADD CONSTRAINT "pages_blocks_geo_mundane_cycles_cycles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_geo_mundane_cycles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_geo_mundane_cycles_research_notes" ADD CONSTRAINT "pages_blocks_geo_mundane_cycles_research_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_geo_mundane_cycles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_geo_mundane_cycles" ADD CONSTRAINT "pages_blocks_geo_mundane_cycles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_geo_case_studies_embed" ADD CONSTRAINT "pages_blocks_geo_case_studies_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_hero_section" ADD CONSTRAINT "_pages_v_blocks_hero_section_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_hero_section" ADD CONSTRAINT "_pages_v_blocks_hero_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_stats_strip_stats" ADD CONSTRAINT "_pages_v_blocks_stats_strip_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_stats_strip"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_stats_strip" ADD CONSTRAINT "_pages_v_blocks_stats_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_statement_band" ADD CONSTRAINT "_pages_v_blocks_statement_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_card_grid_cards_includes" ADD CONSTRAINT "_pages_v_blocks_card_grid_cards_includes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_card_grid_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_card_grid_cards" ADD CONSTRAINT "_pages_v_blocks_card_grid_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_card_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_card_grid" ADD CONSTRAINT "_pages_v_blocks_card_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_split_content_features" ADD CONSTRAINT "_pages_v_blocks_split_content_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_split_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_split_content_numbered_items" ADD CONSTRAINT "_pages_v_blocks_split_content_numbered_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_split_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_split_content" ADD CONSTRAINT "_pages_v_blocks_split_content_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_split_content" ADD CONSTRAINT "_pages_v_blocks_split_content_monogram_id_media_id_fk" FOREIGN KEY ("monogram_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_split_content" ADD CONSTRAINT "_pages_v_blocks_split_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_process_timeline_steps" ADD CONSTRAINT "_pages_v_blocks_process_timeline_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_process_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_process_timeline" ADD CONSTRAINT "_pages_v_blocks_process_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_cta_band_perks" ADD CONSTRAINT "_pages_v_blocks_cta_band_perks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_cta_band"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_cta_band_secondary_cards" ADD CONSTRAINT "_pages_v_blocks_cta_band_secondary_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_cta_band"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_cta_band" ADD CONSTRAINT "_pages_v_blocks_cta_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_ticker_marquee_items" ADD CONSTRAINT "_pages_v_blocks_ticker_marquee_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_ticker_marquee"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_ticker_marquee" ADD CONSTRAINT "_pages_v_blocks_ticker_marquee_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_testimonial_grid_items" ADD CONSTRAINT "_pages_v_blocks_testimonial_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_testimonial_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_testimonial_grid" ADD CONSTRAINT "_pages_v_blocks_testimonial_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_faq_accordion_items" ADD CONSTRAINT "_pages_v_blocks_faq_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_faq_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_faq_accordion" ADD CONSTRAINT "_pages_v_blocks_faq_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_geo_map_section" ADD CONSTRAINT "_pages_v_blocks_geo_map_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_geo_mundane_cycles_cycles" ADD CONSTRAINT "_pages_v_blocks_geo_mundane_cycles_cycles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_geo_mundane_cycles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_geo_mundane_cycles_research_notes" ADD CONSTRAINT "_pages_v_blocks_geo_mundane_cycles_research_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_geo_mundane_cycles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_geo_mundane_cycles" ADD CONSTRAINT "_pages_v_blocks_geo_mundane_cycles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_geo_case_studies_embed" ADD CONSTRAINT "_pages_v_blocks_geo_case_studies_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "payload"."media" USING btree ("sizes_card_filename");
  CREATE INDEX "pages_blocks_hero_section_order_idx" ON "payload"."pages_blocks_hero_section" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_section_parent_id_idx" ON "payload"."pages_blocks_hero_section" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_section_path_idx" ON "payload"."pages_blocks_hero_section" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_section_hero_image_idx" ON "payload"."pages_blocks_hero_section" USING btree ("hero_image_id");
  CREATE INDEX "pages_blocks_stats_strip_stats_order_idx" ON "payload"."pages_blocks_stats_strip_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_strip_stats_parent_id_idx" ON "payload"."pages_blocks_stats_strip_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_strip_order_idx" ON "payload"."pages_blocks_stats_strip" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_strip_parent_id_idx" ON "payload"."pages_blocks_stats_strip" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_strip_path_idx" ON "payload"."pages_blocks_stats_strip" USING btree ("_path");
  CREATE INDEX "pages_blocks_statement_band_order_idx" ON "payload"."pages_blocks_statement_band" USING btree ("_order");
  CREATE INDEX "pages_blocks_statement_band_parent_id_idx" ON "payload"."pages_blocks_statement_band" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_statement_band_path_idx" ON "payload"."pages_blocks_statement_band" USING btree ("_path");
  CREATE INDEX "pages_blocks_card_grid_cards_includes_order_idx" ON "payload"."pages_blocks_card_grid_cards_includes" USING btree ("_order");
  CREATE INDEX "pages_blocks_card_grid_cards_includes_parent_id_idx" ON "payload"."pages_blocks_card_grid_cards_includes" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_card_grid_cards_order_idx" ON "payload"."pages_blocks_card_grid_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_card_grid_cards_parent_id_idx" ON "payload"."pages_blocks_card_grid_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_card_grid_order_idx" ON "payload"."pages_blocks_card_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_card_grid_parent_id_idx" ON "payload"."pages_blocks_card_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_card_grid_path_idx" ON "payload"."pages_blocks_card_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_split_content_features_order_idx" ON "payload"."pages_blocks_split_content_features" USING btree ("_order");
  CREATE INDEX "pages_blocks_split_content_features_parent_id_idx" ON "payload"."pages_blocks_split_content_features" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_split_content_numbered_items_order_idx" ON "payload"."pages_blocks_split_content_numbered_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_split_content_numbered_items_parent_id_idx" ON "payload"."pages_blocks_split_content_numbered_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_split_content_order_idx" ON "payload"."pages_blocks_split_content" USING btree ("_order");
  CREATE INDEX "pages_blocks_split_content_parent_id_idx" ON "payload"."pages_blocks_split_content" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_split_content_path_idx" ON "payload"."pages_blocks_split_content" USING btree ("_path");
  CREATE INDEX "pages_blocks_split_content_image_idx" ON "payload"."pages_blocks_split_content" USING btree ("image_id");
  CREATE INDEX "pages_blocks_split_content_monogram_idx" ON "payload"."pages_blocks_split_content" USING btree ("monogram_id");
  CREATE INDEX "pages_blocks_process_timeline_steps_order_idx" ON "payload"."pages_blocks_process_timeline_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_process_timeline_steps_parent_id_idx" ON "payload"."pages_blocks_process_timeline_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_process_timeline_order_idx" ON "payload"."pages_blocks_process_timeline" USING btree ("_order");
  CREATE INDEX "pages_blocks_process_timeline_parent_id_idx" ON "payload"."pages_blocks_process_timeline" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_process_timeline_path_idx" ON "payload"."pages_blocks_process_timeline" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_band_perks_order_idx" ON "payload"."pages_blocks_cta_band_perks" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_band_perks_parent_id_idx" ON "payload"."pages_blocks_cta_band_perks" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_band_secondary_cards_order_idx" ON "payload"."pages_blocks_cta_band_secondary_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_band_secondary_cards_parent_id_idx" ON "payload"."pages_blocks_cta_band_secondary_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_band_order_idx" ON "payload"."pages_blocks_cta_band" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_band_parent_id_idx" ON "payload"."pages_blocks_cta_band" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_band_path_idx" ON "payload"."pages_blocks_cta_band" USING btree ("_path");
  CREATE INDEX "pages_blocks_ticker_marquee_items_order_idx" ON "payload"."pages_blocks_ticker_marquee_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_ticker_marquee_items_parent_id_idx" ON "payload"."pages_blocks_ticker_marquee_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_ticker_marquee_order_idx" ON "payload"."pages_blocks_ticker_marquee" USING btree ("_order");
  CREATE INDEX "pages_blocks_ticker_marquee_parent_id_idx" ON "payload"."pages_blocks_ticker_marquee" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_ticker_marquee_path_idx" ON "payload"."pages_blocks_ticker_marquee" USING btree ("_path");
  CREATE INDEX "pages_blocks_testimonial_grid_items_order_idx" ON "payload"."pages_blocks_testimonial_grid_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_testimonial_grid_items_parent_id_idx" ON "payload"."pages_blocks_testimonial_grid_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_testimonial_grid_order_idx" ON "payload"."pages_blocks_testimonial_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_testimonial_grid_parent_id_idx" ON "payload"."pages_blocks_testimonial_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_testimonial_grid_path_idx" ON "payload"."pages_blocks_testimonial_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_faq_accordion_items_order_idx" ON "payload"."pages_blocks_faq_accordion_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_accordion_items_parent_id_idx" ON "payload"."pages_blocks_faq_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_accordion_order_idx" ON "payload"."pages_blocks_faq_accordion" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_accordion_parent_id_idx" ON "payload"."pages_blocks_faq_accordion" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_accordion_path_idx" ON "payload"."pages_blocks_faq_accordion" USING btree ("_path");
  CREATE INDEX "pages_blocks_geo_map_section_order_idx" ON "payload"."pages_blocks_geo_map_section" USING btree ("_order");
  CREATE INDEX "pages_blocks_geo_map_section_parent_id_idx" ON "payload"."pages_blocks_geo_map_section" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_geo_map_section_path_idx" ON "payload"."pages_blocks_geo_map_section" USING btree ("_path");
  CREATE INDEX "pages_blocks_geo_mundane_cycles_cycles_order_idx" ON "payload"."pages_blocks_geo_mundane_cycles_cycles" USING btree ("_order");
  CREATE INDEX "pages_blocks_geo_mundane_cycles_cycles_parent_id_idx" ON "payload"."pages_blocks_geo_mundane_cycles_cycles" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_geo_mundane_cycles_research_notes_order_idx" ON "payload"."pages_blocks_geo_mundane_cycles_research_notes" USING btree ("_order");
  CREATE INDEX "pages_blocks_geo_mundane_cycles_research_notes_parent_id_idx" ON "payload"."pages_blocks_geo_mundane_cycles_research_notes" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_geo_mundane_cycles_order_idx" ON "payload"."pages_blocks_geo_mundane_cycles" USING btree ("_order");
  CREATE INDEX "pages_blocks_geo_mundane_cycles_parent_id_idx" ON "payload"."pages_blocks_geo_mundane_cycles" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_geo_mundane_cycles_path_idx" ON "payload"."pages_blocks_geo_mundane_cycles" USING btree ("_path");
  CREATE INDEX "pages_blocks_geo_case_studies_embed_order_idx" ON "payload"."pages_blocks_geo_case_studies_embed" USING btree ("_order");
  CREATE INDEX "pages_blocks_geo_case_studies_embed_parent_id_idx" ON "payload"."pages_blocks_geo_case_studies_embed" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_geo_case_studies_embed_path_idx" ON "payload"."pages_blocks_geo_case_studies_embed" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "payload"."pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "payload"."pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "payload"."pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "payload"."pages" USING btree ("_status");
  CREATE INDEX "_pages_v_blocks_hero_section_order_idx" ON "payload"."_pages_v_blocks_hero_section" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_section_parent_id_idx" ON "payload"."_pages_v_blocks_hero_section" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_section_path_idx" ON "payload"."_pages_v_blocks_hero_section" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_section_hero_image_idx" ON "payload"."_pages_v_blocks_hero_section" USING btree ("hero_image_id");
  CREATE INDEX "_pages_v_blocks_stats_strip_stats_order_idx" ON "payload"."_pages_v_blocks_stats_strip_stats" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_strip_stats_parent_id_idx" ON "payload"."_pages_v_blocks_stats_strip_stats" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_strip_order_idx" ON "payload"."_pages_v_blocks_stats_strip" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_strip_parent_id_idx" ON "payload"."_pages_v_blocks_stats_strip" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_strip_path_idx" ON "payload"."_pages_v_blocks_stats_strip" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_statement_band_order_idx" ON "payload"."_pages_v_blocks_statement_band" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_statement_band_parent_id_idx" ON "payload"."_pages_v_blocks_statement_band" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_statement_band_path_idx" ON "payload"."_pages_v_blocks_statement_band" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_card_grid_cards_includes_order_idx" ON "payload"."_pages_v_blocks_card_grid_cards_includes" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_card_grid_cards_includes_parent_id_idx" ON "payload"."_pages_v_blocks_card_grid_cards_includes" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_card_grid_cards_order_idx" ON "payload"."_pages_v_blocks_card_grid_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_card_grid_cards_parent_id_idx" ON "payload"."_pages_v_blocks_card_grid_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_card_grid_order_idx" ON "payload"."_pages_v_blocks_card_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_card_grid_parent_id_idx" ON "payload"."_pages_v_blocks_card_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_card_grid_path_idx" ON "payload"."_pages_v_blocks_card_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_split_content_features_order_idx" ON "payload"."_pages_v_blocks_split_content_features" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_split_content_features_parent_id_idx" ON "payload"."_pages_v_blocks_split_content_features" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_split_content_numbered_items_order_idx" ON "payload"."_pages_v_blocks_split_content_numbered_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_split_content_numbered_items_parent_id_idx" ON "payload"."_pages_v_blocks_split_content_numbered_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_split_content_order_idx" ON "payload"."_pages_v_blocks_split_content" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_split_content_parent_id_idx" ON "payload"."_pages_v_blocks_split_content" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_split_content_path_idx" ON "payload"."_pages_v_blocks_split_content" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_split_content_image_idx" ON "payload"."_pages_v_blocks_split_content" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_split_content_monogram_idx" ON "payload"."_pages_v_blocks_split_content" USING btree ("monogram_id");
  CREATE INDEX "_pages_v_blocks_process_timeline_steps_order_idx" ON "payload"."_pages_v_blocks_process_timeline_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_process_timeline_steps_parent_id_idx" ON "payload"."_pages_v_blocks_process_timeline_steps" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_process_timeline_order_idx" ON "payload"."_pages_v_blocks_process_timeline" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_process_timeline_parent_id_idx" ON "payload"."_pages_v_blocks_process_timeline" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_process_timeline_path_idx" ON "payload"."_pages_v_blocks_process_timeline" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_band_perks_order_idx" ON "payload"."_pages_v_blocks_cta_band_perks" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_band_perks_parent_id_idx" ON "payload"."_pages_v_blocks_cta_band_perks" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_band_secondary_cards_order_idx" ON "payload"."_pages_v_blocks_cta_band_secondary_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_band_secondary_cards_parent_id_idx" ON "payload"."_pages_v_blocks_cta_band_secondary_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_band_order_idx" ON "payload"."_pages_v_blocks_cta_band" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_band_parent_id_idx" ON "payload"."_pages_v_blocks_cta_band" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_band_path_idx" ON "payload"."_pages_v_blocks_cta_band" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_ticker_marquee_items_order_idx" ON "payload"."_pages_v_blocks_ticker_marquee_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_ticker_marquee_items_parent_id_idx" ON "payload"."_pages_v_blocks_ticker_marquee_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_ticker_marquee_order_idx" ON "payload"."_pages_v_blocks_ticker_marquee" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_ticker_marquee_parent_id_idx" ON "payload"."_pages_v_blocks_ticker_marquee" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_ticker_marquee_path_idx" ON "payload"."_pages_v_blocks_ticker_marquee" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_testimonial_grid_items_order_idx" ON "payload"."_pages_v_blocks_testimonial_grid_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_testimonial_grid_items_parent_id_idx" ON "payload"."_pages_v_blocks_testimonial_grid_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_testimonial_grid_order_idx" ON "payload"."_pages_v_blocks_testimonial_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_testimonial_grid_parent_id_idx" ON "payload"."_pages_v_blocks_testimonial_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_testimonial_grid_path_idx" ON "payload"."_pages_v_blocks_testimonial_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_faq_accordion_items_order_idx" ON "payload"."_pages_v_blocks_faq_accordion_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_accordion_items_parent_id_idx" ON "payload"."_pages_v_blocks_faq_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_accordion_order_idx" ON "payload"."_pages_v_blocks_faq_accordion" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_accordion_parent_id_idx" ON "payload"."_pages_v_blocks_faq_accordion" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_accordion_path_idx" ON "payload"."_pages_v_blocks_faq_accordion" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_geo_map_section_order_idx" ON "payload"."_pages_v_blocks_geo_map_section" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_geo_map_section_parent_id_idx" ON "payload"."_pages_v_blocks_geo_map_section" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_geo_map_section_path_idx" ON "payload"."_pages_v_blocks_geo_map_section" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_geo_mundane_cycles_cycles_order_idx" ON "payload"."_pages_v_blocks_geo_mundane_cycles_cycles" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_geo_mundane_cycles_cycles_parent_id_idx" ON "payload"."_pages_v_blocks_geo_mundane_cycles_cycles" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_geo_mundane_cycles_research_notes_order_idx" ON "payload"."_pages_v_blocks_geo_mundane_cycles_research_notes" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_geo_mundane_cycles_research_notes_parent_id_idx" ON "payload"."_pages_v_blocks_geo_mundane_cycles_research_notes" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_geo_mundane_cycles_order_idx" ON "payload"."_pages_v_blocks_geo_mundane_cycles" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_geo_mundane_cycles_parent_id_idx" ON "payload"."_pages_v_blocks_geo_mundane_cycles" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_geo_mundane_cycles_path_idx" ON "payload"."_pages_v_blocks_geo_mundane_cycles" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_geo_case_studies_embed_order_idx" ON "payload"."_pages_v_blocks_geo_case_studies_embed" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_geo_case_studies_embed_parent_id_idx" ON "payload"."_pages_v_blocks_geo_case_studies_embed" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_geo_case_studies_embed_path_idx" ON "payload"."_pages_v_blocks_geo_case_studies_embed" USING btree ("_path");
  CREATE INDEX "_pages_v_parent_idx" ON "payload"."_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "payload"."_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "payload"."_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "payload"."_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "payload"."_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "payload"."_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "payload"."_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "payload"."_pages_v" USING btree ("latest");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."pages_blocks_hero_section" CASCADE;
  DROP TABLE "payload"."pages_blocks_stats_strip_stats" CASCADE;
  DROP TABLE "payload"."pages_blocks_stats_strip" CASCADE;
  DROP TABLE "payload"."pages_blocks_statement_band" CASCADE;
  DROP TABLE "payload"."pages_blocks_card_grid_cards_includes" CASCADE;
  DROP TABLE "payload"."pages_blocks_card_grid_cards" CASCADE;
  DROP TABLE "payload"."pages_blocks_card_grid" CASCADE;
  DROP TABLE "payload"."pages_blocks_split_content_features" CASCADE;
  DROP TABLE "payload"."pages_blocks_split_content_numbered_items" CASCADE;
  DROP TABLE "payload"."pages_blocks_split_content" CASCADE;
  DROP TABLE "payload"."pages_blocks_process_timeline_steps" CASCADE;
  DROP TABLE "payload"."pages_blocks_process_timeline" CASCADE;
  DROP TABLE "payload"."pages_blocks_cta_band_perks" CASCADE;
  DROP TABLE "payload"."pages_blocks_cta_band_secondary_cards" CASCADE;
  DROP TABLE "payload"."pages_blocks_cta_band" CASCADE;
  DROP TABLE "payload"."pages_blocks_ticker_marquee_items" CASCADE;
  DROP TABLE "payload"."pages_blocks_ticker_marquee" CASCADE;
  DROP TABLE "payload"."pages_blocks_testimonial_grid_items" CASCADE;
  DROP TABLE "payload"."pages_blocks_testimonial_grid" CASCADE;
  DROP TABLE "payload"."pages_blocks_faq_accordion_items" CASCADE;
  DROP TABLE "payload"."pages_blocks_faq_accordion" CASCADE;
  DROP TABLE "payload"."pages_blocks_geo_map_section" CASCADE;
  DROP TABLE "payload"."pages_blocks_geo_mundane_cycles_cycles" CASCADE;
  DROP TABLE "payload"."pages_blocks_geo_mundane_cycles_research_notes" CASCADE;
  DROP TABLE "payload"."pages_blocks_geo_mundane_cycles" CASCADE;
  DROP TABLE "payload"."pages_blocks_geo_case_studies_embed" CASCADE;
  DROP TABLE "payload"."pages" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_hero_section" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_stats_strip_stats" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_stats_strip" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_statement_band" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_card_grid_cards_includes" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_card_grid_cards" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_card_grid" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_split_content_features" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_split_content_numbered_items" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_split_content" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_process_timeline_steps" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_process_timeline" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_cta_band_perks" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_cta_band_secondary_cards" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_cta_band" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_ticker_marquee_items" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_ticker_marquee" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_testimonial_grid_items" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_testimonial_grid" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_faq_accordion_items" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_faq_accordion" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_geo_map_section" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_geo_mundane_cycles_cycles" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_geo_mundane_cycles_research_notes" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_geo_mundane_cycles" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_geo_case_studies_embed" CASCADE;
  DROP TABLE "payload"."_pages_v" CASCADE;
  DROP TABLE "payload"."payload_kv" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TYPE "payload"."enum_users_role";
  DROP TYPE "payload"."enum_pages_blocks_hero_section_decorative_element";
  DROP TYPE "payload"."enum_pages_blocks_hero_section_layout";
  DROP TYPE "payload"."enum_pages_blocks_statement_band_variant";
  DROP TYPE "payload"."enum_pages_blocks_card_grid_variant";
  DROP TYPE "payload"."enum_pages_blocks_card_grid_section_bg";
  DROP TYPE "payload"."enum_pages_blocks_split_content_layout";
  DROP TYPE "payload"."enum_pages_blocks_split_content_image_side";
  DROP TYPE "payload"."enum_pages_blocks_cta_band_layout";
  DROP TYPE "payload"."enum_pages_blocks_cta_band_decorative_element";
  DROP TYPE "payload"."enum_pages_status";
  DROP TYPE "payload"."enum__pages_v_blocks_hero_section_decorative_element";
  DROP TYPE "payload"."enum__pages_v_blocks_hero_section_layout";
  DROP TYPE "payload"."enum__pages_v_blocks_statement_band_variant";
  DROP TYPE "payload"."enum__pages_v_blocks_card_grid_variant";
  DROP TYPE "payload"."enum__pages_v_blocks_card_grid_section_bg";
  DROP TYPE "payload"."enum__pages_v_blocks_split_content_layout";
  DROP TYPE "payload"."enum__pages_v_blocks_split_content_image_side";
  DROP TYPE "payload"."enum__pages_v_blocks_cta_band_layout";
  DROP TYPE "payload"."enum__pages_v_blocks_cta_band_decorative_element";
  DROP TYPE "payload"."enum__pages_v_version_status";`)
}
