import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "pages_blocks_home_hero" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_home_stats_row_stats" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_home_stats_row" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_home_mission" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_home_services_grid_services" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_home_services_grid" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_home_featured_workshop_meta" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_home_featured_workshop" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_home_methodology_items" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_home_methodology" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_home_newsletter" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_b2b_hero" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_b2b_stats_stats" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_b2b_stats" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_b2b_premise" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_b2b_pillars_pillars" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_b2b_pillars" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_b2b_packages_packages_includes" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_b2b_packages_packages" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_b2b_packages" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_b2b_vip_retainer_features" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_b2b_vip_retainer" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_b2b_process_steps" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_b2b_process" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_b2b_disclaimer" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_b2b_cta_band" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_mfh_hero" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_mfh_image_text_band" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_mfh_workshop_modules_modules" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_mfh_workshop_modules" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_mfh_pull_quote" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_mfh_authority" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_mfh_buy_band_perks" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_mfh_buy_band" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_mfh_deep_pitch" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_geo_hero" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_geo_what_is" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_geo_technique_grid_cards" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_geo_technique_grid" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_geo_closing_cta_secondary_cards" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_geo_closing_cta" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_home_services_grid_services_bg_token";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_b2b_pillars_pillars_bg_token";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_b2b_pillars_pillars_text_token";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_b2b_vip_retainer_features_icon";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_mfh_image_text_band_bg_token";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_mfh_image_text_band_image_side";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_mfh_workshop_modules_modules_bg_token";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_geo_technique_grid_cards_variant";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_home_services_grid_services_bg_token" AS ENUM('charcoal', 'bg', 'y2k-blue', 'black');
  CREATE TYPE "public"."enum_pages_blocks_b2b_pillars_pillars_bg_token" AS ENUM('bg-raised', 'charcoal', 'acqua', 'y2k-blue');
  CREATE TYPE "public"."enum_pages_blocks_b2b_pillars_pillars_text_token" AS ENUM('primary', 'eggshell');
  CREATE TYPE "public"."enum_pages_blocks_b2b_vip_retainer_features_icon" AS ENUM('moon', 'sun', 'alert', 'compass', 'file');
  CREATE TYPE "public"."enum_pages_blocks_mfh_image_text_band_bg_token" AS ENUM('default', 'charcoal', 'spiced', 'raised');
  CREATE TYPE "public"."enum_pages_blocks_mfh_image_text_band_image_side" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_pages_blocks_mfh_workshop_modules_modules_bg_token" AS ENUM('charcoal', 'raised', 'y2k-blue', 'black');
  CREATE TYPE "public"."enum_pages_blocks_geo_technique_grid_cards_variant" AS ENUM('charcoal', 'raised', 'y2k-blue');
  CREATE TABLE "pages_blocks_home_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar NOT NULL,
  	"title_line_accent" varchar NOT NULL,
  	"title_line1" varchar NOT NULL,
  	"title_emphasis" varchar NOT NULL,
  	"title_line2" varchar NOT NULL,
  	"title_line3" varchar NOT NULL,
  	"subtitle" varchar NOT NULL,
  	"primary_cta_label" varchar NOT NULL,
  	"primary_cta_href" varchar NOT NULL,
  	"secondary_cta_label" varchar NOT NULL,
  	"secondary_cta_href" varchar NOT NULL,
  	"hero_image_id" integer NOT NULL,
  	"badge_kicker" varchar NOT NULL,
  	"badge_title" varchar NOT NULL,
  	"saturn_glyph_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_stats_row_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"n" varchar NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_home_stats_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_mission" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar NOT NULL,
  	"body_before" varchar NOT NULL,
  	"body_emphasis" varchar NOT NULL,
  	"body_after" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_services_grid_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"num" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"desc" varchar NOT NULL,
  	"link" varchar NOT NULL,
  	"link_label" varchar NOT NULL,
  	"bg_token" "enum_pages_blocks_home_services_grid_services_bg_token" NOT NULL,
  	"light" boolean DEFAULT false,
  	"glyph" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_home_services_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"count_label" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_featured_workshop_meta" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_home_featured_workshop" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar NOT NULL,
  	"title_accent" varchar NOT NULL,
  	"title_rest" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"cta_label" varchar NOT NULL,
  	"cta_href" varchar NOT NULL,
  	"image_id" integer NOT NULL,
  	"price_badge_kicker" varchar NOT NULL,
  	"price_badge_line1" varchar NOT NULL,
  	"price_badge_line2" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_methodology_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"glyph" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"desc" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_home_methodology" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"portrait_id" integer NOT NULL,
  	"monogram_id" integer,
  	"heading" varchar NOT NULL,
  	"intro" varchar NOT NULL,
  	"cta_label" varchar NOT NULL,
  	"cta_href" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_newsletter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"accent" varchar NOT NULL,
  	"title_line1" varchar NOT NULL,
  	"title_line2" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_b2b_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar NOT NULL,
  	"title_accent" varchar NOT NULL,
  	"title_line1" varchar NOT NULL,
  	"title_line2" varchar NOT NULL,
  	"title_emphasis" varchar NOT NULL,
  	"title_line3" varchar NOT NULL,
  	"subtitle" varchar NOT NULL,
  	"primary_cta_label" varchar NOT NULL,
  	"primary_cta_href" varchar NOT NULL,
  	"secondary_cta_label" varchar NOT NULL,
  	"secondary_cta_href" varchar NOT NULL,
  	"hero_image_id" integer NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_b2b_stats_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"n" varchar NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_b2b_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_b2b_premise" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar NOT NULL,
  	"body_html" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_b2b_pillars_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"num" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"desc" varchar NOT NULL,
  	"tag" varchar NOT NULL,
  	"bg_token" "enum_pages_blocks_b2b_pillars_pillars_bg_token" NOT NULL,
  	"text_token" "enum_pages_blocks_b2b_pillars_pillars_text_token" NOT NULL
  );
  
  CREATE TABLE "pages_blocks_b2b_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section_kicker" varchar NOT NULL,
  	"heading_html" varchar NOT NULL,
  	"sidebar" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_b2b_packages_packages_includes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"line" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_b2b_packages_packages" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tier" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"tagline" varchar NOT NULL,
  	"from" varchar NOT NULL,
  	"glyph" varchar NOT NULL,
  	"primary" boolean DEFAULT false,
  	"enquire_label" varchar NOT NULL,
  	"enquire_href" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_b2b_packages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar NOT NULL,
  	"heading" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_b2b_vip_retainer_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_pages_blocks_b2b_vip_retainer_features_icon" NOT NULL,
  	"title" varchar NOT NULL,
  	"desc" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_b2b_vip_retainer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar NOT NULL,
  	"title_html" varchar NOT NULL,
  	"body1" varchar NOT NULL,
  	"body2" varchar NOT NULL,
  	"apply_label" varchar NOT NULL,
  	"apply_href" varchar NOT NULL,
  	"investment_kicker" varchar NOT NULL,
  	"price_line" varchar NOT NULL,
  	"price_note" varchar NOT NULL,
  	"limit_note" varchar NOT NULL,
  	"testimonial_kicker" varchar NOT NULL,
  	"testimonial_meta" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_b2b_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"n" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_b2b_process" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar NOT NULL,
  	"heading_html" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_b2b_disclaimer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_b2b_cta_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"accent" varchar NOT NULL,
  	"heading_html" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"primary_label" varchar NOT NULL,
  	"primary_href" varchar NOT NULL,
  	"secondary_label" varchar NOT NULL,
  	"secondary_href" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_mfh_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar NOT NULL,
  	"title_line1" varchar NOT NULL,
  	"title_accent" varchar NOT NULL,
  	"lead" varchar NOT NULL,
  	"callout1" varchar NOT NULL,
  	"callout2" varchar NOT NULL,
  	"cta_label" varchar NOT NULL,
  	"cta_href" varchar NOT NULL,
  	"hero_image_id" integer NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_mfh_image_text_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"bg_token" "enum_pages_blocks_mfh_image_text_band_bg_token" NOT NULL,
  	"image_id" integer,
  	"image_side" "enum_pages_blocks_mfh_image_text_band_image_side" DEFAULT 'left',
  	"kicker" varchar,
  	"heading" varchar,
  	"body_rich" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_mfh_workshop_modules_modules" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"num" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"desc" varchar NOT NULL,
  	"glyph" varchar NOT NULL,
  	"bg_token" "enum_pages_blocks_mfh_workshop_modules_modules_bg_token" NOT NULL
  );
  
  CREATE TABLE "pages_blocks_mfh_workshop_modules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"kicker" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_mfh_pull_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"quote" varchar NOT NULL,
  	"attribution" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_mfh_authority" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar NOT NULL,
  	"heading_html" varchar NOT NULL,
  	"body" jsonb NOT NULL,
  	"image_id" integer NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_mfh_buy_band_perks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"line" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_mfh_buy_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar NOT NULL,
  	"heading_html" varchar NOT NULL,
  	"price_line" varchar NOT NULL,
  	"cta_label" varchar NOT NULL,
  	"cta_href" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_mfh_deep_pitch" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"body" jsonb NOT NULL,
  	"closing" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_geo_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar NOT NULL,
  	"title_accent" varchar NOT NULL,
  	"title_line" varchar NOT NULL,
  	"body1" varchar NOT NULL,
  	"body2" varchar NOT NULL,
  	"primary_cta_label" varchar NOT NULL,
  	"primary_cta_href" varchar NOT NULL,
  	"secondary_cta_label" varchar NOT NULL,
  	"secondary_cta_href" varchar NOT NULL,
  	"footnote" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_geo_what_is" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"section_label" varchar NOT NULL,
  	"left_col_title" varchar NOT NULL,
  	"left_col_body" jsonb NOT NULL,
  	"right_col_title" varchar NOT NULL,
  	"right_col_body" jsonb NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_geo_technique_grid_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"num" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"variant" "enum_pages_blocks_geo_technique_grid_cards_variant" NOT NULL,
  	"watermark" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_geo_technique_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"section_label" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_geo_closing_cta_secondary_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar NOT NULL,
  	"title_html" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_geo_closing_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar NOT NULL,
  	"heading_html" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"primary_card_kicker" varchar NOT NULL,
  	"primary_card_title_html" varchar NOT NULL,
  	"primary_card_href" varchar NOT NULL,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_home_hero" ADD CONSTRAINT "pages_blocks_home_hero_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_hero" ADD CONSTRAINT "pages_blocks_home_hero_saturn_glyph_id_media_id_fk" FOREIGN KEY ("saturn_glyph_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_hero" ADD CONSTRAINT "pages_blocks_home_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_stats_row_stats" ADD CONSTRAINT "pages_blocks_home_stats_row_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_home_stats_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_stats_row" ADD CONSTRAINT "pages_blocks_home_stats_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_mission" ADD CONSTRAINT "pages_blocks_home_mission_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_services_grid_services" ADD CONSTRAINT "pages_blocks_home_services_grid_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_home_services_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_services_grid" ADD CONSTRAINT "pages_blocks_home_services_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_featured_workshop_meta" ADD CONSTRAINT "pages_blocks_home_featured_workshop_meta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_home_featured_workshop"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_featured_workshop" ADD CONSTRAINT "pages_blocks_home_featured_workshop_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_featured_workshop" ADD CONSTRAINT "pages_blocks_home_featured_workshop_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_methodology_items" ADD CONSTRAINT "pages_blocks_home_methodology_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_home_methodology"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_methodology" ADD CONSTRAINT "pages_blocks_home_methodology_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_methodology" ADD CONSTRAINT "pages_blocks_home_methodology_monogram_id_media_id_fk" FOREIGN KEY ("monogram_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_methodology" ADD CONSTRAINT "pages_blocks_home_methodology_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_newsletter" ADD CONSTRAINT "pages_blocks_home_newsletter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_b2b_hero" ADD CONSTRAINT "pages_blocks_b2b_hero_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_b2b_hero" ADD CONSTRAINT "pages_blocks_b2b_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_b2b_stats_stats" ADD CONSTRAINT "pages_blocks_b2b_stats_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_b2b_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_b2b_stats" ADD CONSTRAINT "pages_blocks_b2b_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_b2b_premise" ADD CONSTRAINT "pages_blocks_b2b_premise_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_b2b_pillars_pillars" ADD CONSTRAINT "pages_blocks_b2b_pillars_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_b2b_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_b2b_pillars" ADD CONSTRAINT "pages_blocks_b2b_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_b2b_packages_packages_includes" ADD CONSTRAINT "pages_blocks_b2b_packages_packages_includes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_b2b_packages_packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_b2b_packages_packages" ADD CONSTRAINT "pages_blocks_b2b_packages_packages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_b2b_packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_b2b_packages" ADD CONSTRAINT "pages_blocks_b2b_packages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_b2b_vip_retainer_features" ADD CONSTRAINT "pages_blocks_b2b_vip_retainer_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_b2b_vip_retainer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_b2b_vip_retainer" ADD CONSTRAINT "pages_blocks_b2b_vip_retainer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_b2b_process_steps" ADD CONSTRAINT "pages_blocks_b2b_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_b2b_process"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_b2b_process" ADD CONSTRAINT "pages_blocks_b2b_process_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_b2b_disclaimer" ADD CONSTRAINT "pages_blocks_b2b_disclaimer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_b2b_cta_band" ADD CONSTRAINT "pages_blocks_b2b_cta_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_mfh_hero" ADD CONSTRAINT "pages_blocks_mfh_hero_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_mfh_hero" ADD CONSTRAINT "pages_blocks_mfh_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_mfh_image_text_band" ADD CONSTRAINT "pages_blocks_mfh_image_text_band_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_mfh_image_text_band" ADD CONSTRAINT "pages_blocks_mfh_image_text_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_mfh_workshop_modules_modules" ADD CONSTRAINT "pages_blocks_mfh_workshop_modules_modules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_mfh_workshop_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_mfh_workshop_modules" ADD CONSTRAINT "pages_blocks_mfh_workshop_modules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_mfh_pull_quote" ADD CONSTRAINT "pages_blocks_mfh_pull_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_mfh_authority" ADD CONSTRAINT "pages_blocks_mfh_authority_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_mfh_authority" ADD CONSTRAINT "pages_blocks_mfh_authority_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_mfh_buy_band_perks" ADD CONSTRAINT "pages_blocks_mfh_buy_band_perks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_mfh_buy_band"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_mfh_buy_band" ADD CONSTRAINT "pages_blocks_mfh_buy_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_mfh_deep_pitch" ADD CONSTRAINT "pages_blocks_mfh_deep_pitch_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_geo_hero" ADD CONSTRAINT "pages_blocks_geo_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_geo_what_is" ADD CONSTRAINT "pages_blocks_geo_what_is_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_geo_technique_grid_cards" ADD CONSTRAINT "pages_blocks_geo_technique_grid_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_geo_technique_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_geo_technique_grid" ADD CONSTRAINT "pages_blocks_geo_technique_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_geo_closing_cta_secondary_cards" ADD CONSTRAINT "pages_blocks_geo_closing_cta_secondary_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_geo_closing_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_geo_closing_cta" ADD CONSTRAINT "pages_blocks_geo_closing_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_home_hero_order_idx" ON "pages_blocks_home_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_hero_parent_id_idx" ON "pages_blocks_home_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_hero_path_idx" ON "pages_blocks_home_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_hero_hero_image_idx" ON "pages_blocks_home_hero" USING btree ("hero_image_id");
  CREATE INDEX "pages_blocks_home_hero_saturn_glyph_idx" ON "pages_blocks_home_hero" USING btree ("saturn_glyph_id");
  CREATE INDEX "pages_blocks_home_stats_row_stats_order_idx" ON "pages_blocks_home_stats_row_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_stats_row_stats_parent_id_idx" ON "pages_blocks_home_stats_row_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_stats_row_order_idx" ON "pages_blocks_home_stats_row" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_stats_row_parent_id_idx" ON "pages_blocks_home_stats_row" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_stats_row_path_idx" ON "pages_blocks_home_stats_row" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_mission_order_idx" ON "pages_blocks_home_mission" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_mission_parent_id_idx" ON "pages_blocks_home_mission" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_mission_path_idx" ON "pages_blocks_home_mission" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_services_grid_services_order_idx" ON "pages_blocks_home_services_grid_services" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_services_grid_services_parent_id_idx" ON "pages_blocks_home_services_grid_services" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_services_grid_order_idx" ON "pages_blocks_home_services_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_services_grid_parent_id_idx" ON "pages_blocks_home_services_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_services_grid_path_idx" ON "pages_blocks_home_services_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_featured_workshop_meta_order_idx" ON "pages_blocks_home_featured_workshop_meta" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_featured_workshop_meta_parent_id_idx" ON "pages_blocks_home_featured_workshop_meta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_featured_workshop_order_idx" ON "pages_blocks_home_featured_workshop" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_featured_workshop_parent_id_idx" ON "pages_blocks_home_featured_workshop" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_featured_workshop_path_idx" ON "pages_blocks_home_featured_workshop" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_featured_workshop_image_idx" ON "pages_blocks_home_featured_workshop" USING btree ("image_id");
  CREATE INDEX "pages_blocks_home_methodology_items_order_idx" ON "pages_blocks_home_methodology_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_methodology_items_parent_id_idx" ON "pages_blocks_home_methodology_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_methodology_order_idx" ON "pages_blocks_home_methodology" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_methodology_parent_id_idx" ON "pages_blocks_home_methodology" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_methodology_path_idx" ON "pages_blocks_home_methodology" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_methodology_portrait_idx" ON "pages_blocks_home_methodology" USING btree ("portrait_id");
  CREATE INDEX "pages_blocks_home_methodology_monogram_idx" ON "pages_blocks_home_methodology" USING btree ("monogram_id");
  CREATE INDEX "pages_blocks_home_newsletter_order_idx" ON "pages_blocks_home_newsletter" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_newsletter_parent_id_idx" ON "pages_blocks_home_newsletter" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_newsletter_path_idx" ON "pages_blocks_home_newsletter" USING btree ("_path");
  CREATE INDEX "pages_blocks_b2b_hero_order_idx" ON "pages_blocks_b2b_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_b2b_hero_parent_id_idx" ON "pages_blocks_b2b_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_b2b_hero_path_idx" ON "pages_blocks_b2b_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_b2b_hero_hero_image_idx" ON "pages_blocks_b2b_hero" USING btree ("hero_image_id");
  CREATE INDEX "pages_blocks_b2b_stats_stats_order_idx" ON "pages_blocks_b2b_stats_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_b2b_stats_stats_parent_id_idx" ON "pages_blocks_b2b_stats_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_b2b_stats_order_idx" ON "pages_blocks_b2b_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_b2b_stats_parent_id_idx" ON "pages_blocks_b2b_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_b2b_stats_path_idx" ON "pages_blocks_b2b_stats" USING btree ("_path");
  CREATE INDEX "pages_blocks_b2b_premise_order_idx" ON "pages_blocks_b2b_premise" USING btree ("_order");
  CREATE INDEX "pages_blocks_b2b_premise_parent_id_idx" ON "pages_blocks_b2b_premise" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_b2b_premise_path_idx" ON "pages_blocks_b2b_premise" USING btree ("_path");
  CREATE INDEX "pages_blocks_b2b_pillars_pillars_order_idx" ON "pages_blocks_b2b_pillars_pillars" USING btree ("_order");
  CREATE INDEX "pages_blocks_b2b_pillars_pillars_parent_id_idx" ON "pages_blocks_b2b_pillars_pillars" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_b2b_pillars_order_idx" ON "pages_blocks_b2b_pillars" USING btree ("_order");
  CREATE INDEX "pages_blocks_b2b_pillars_parent_id_idx" ON "pages_blocks_b2b_pillars" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_b2b_pillars_path_idx" ON "pages_blocks_b2b_pillars" USING btree ("_path");
  CREATE INDEX "pages_blocks_b2b_packages_packages_includes_order_idx" ON "pages_blocks_b2b_packages_packages_includes" USING btree ("_order");
  CREATE INDEX "pages_blocks_b2b_packages_packages_includes_parent_id_idx" ON "pages_blocks_b2b_packages_packages_includes" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_b2b_packages_packages_order_idx" ON "pages_blocks_b2b_packages_packages" USING btree ("_order");
  CREATE INDEX "pages_blocks_b2b_packages_packages_parent_id_idx" ON "pages_blocks_b2b_packages_packages" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_b2b_packages_order_idx" ON "pages_blocks_b2b_packages" USING btree ("_order");
  CREATE INDEX "pages_blocks_b2b_packages_parent_id_idx" ON "pages_blocks_b2b_packages" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_b2b_packages_path_idx" ON "pages_blocks_b2b_packages" USING btree ("_path");
  CREATE INDEX "pages_blocks_b2b_vip_retainer_features_order_idx" ON "pages_blocks_b2b_vip_retainer_features" USING btree ("_order");
  CREATE INDEX "pages_blocks_b2b_vip_retainer_features_parent_id_idx" ON "pages_blocks_b2b_vip_retainer_features" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_b2b_vip_retainer_order_idx" ON "pages_blocks_b2b_vip_retainer" USING btree ("_order");
  CREATE INDEX "pages_blocks_b2b_vip_retainer_parent_id_idx" ON "pages_blocks_b2b_vip_retainer" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_b2b_vip_retainer_path_idx" ON "pages_blocks_b2b_vip_retainer" USING btree ("_path");
  CREATE INDEX "pages_blocks_b2b_process_steps_order_idx" ON "pages_blocks_b2b_process_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_b2b_process_steps_parent_id_idx" ON "pages_blocks_b2b_process_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_b2b_process_order_idx" ON "pages_blocks_b2b_process" USING btree ("_order");
  CREATE INDEX "pages_blocks_b2b_process_parent_id_idx" ON "pages_blocks_b2b_process" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_b2b_process_path_idx" ON "pages_blocks_b2b_process" USING btree ("_path");
  CREATE INDEX "pages_blocks_b2b_disclaimer_order_idx" ON "pages_blocks_b2b_disclaimer" USING btree ("_order");
  CREATE INDEX "pages_blocks_b2b_disclaimer_parent_id_idx" ON "pages_blocks_b2b_disclaimer" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_b2b_disclaimer_path_idx" ON "pages_blocks_b2b_disclaimer" USING btree ("_path");
  CREATE INDEX "pages_blocks_b2b_cta_band_order_idx" ON "pages_blocks_b2b_cta_band" USING btree ("_order");
  CREATE INDEX "pages_blocks_b2b_cta_band_parent_id_idx" ON "pages_blocks_b2b_cta_band" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_b2b_cta_band_path_idx" ON "pages_blocks_b2b_cta_band" USING btree ("_path");
  CREATE INDEX "pages_blocks_mfh_hero_order_idx" ON "pages_blocks_mfh_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_mfh_hero_parent_id_idx" ON "pages_blocks_mfh_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_mfh_hero_path_idx" ON "pages_blocks_mfh_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_mfh_hero_hero_image_idx" ON "pages_blocks_mfh_hero" USING btree ("hero_image_id");
  CREATE INDEX "pages_blocks_mfh_image_text_band_order_idx" ON "pages_blocks_mfh_image_text_band" USING btree ("_order");
  CREATE INDEX "pages_blocks_mfh_image_text_band_parent_id_idx" ON "pages_blocks_mfh_image_text_band" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_mfh_image_text_band_path_idx" ON "pages_blocks_mfh_image_text_band" USING btree ("_path");
  CREATE INDEX "pages_blocks_mfh_image_text_band_image_idx" ON "pages_blocks_mfh_image_text_band" USING btree ("image_id");
  CREATE INDEX "pages_blocks_mfh_workshop_modules_modules_order_idx" ON "pages_blocks_mfh_workshop_modules_modules" USING btree ("_order");
  CREATE INDEX "pages_blocks_mfh_workshop_modules_modules_parent_id_idx" ON "pages_blocks_mfh_workshop_modules_modules" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_mfh_workshop_modules_order_idx" ON "pages_blocks_mfh_workshop_modules" USING btree ("_order");
  CREATE INDEX "pages_blocks_mfh_workshop_modules_parent_id_idx" ON "pages_blocks_mfh_workshop_modules" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_mfh_workshop_modules_path_idx" ON "pages_blocks_mfh_workshop_modules" USING btree ("_path");
  CREATE INDEX "pages_blocks_mfh_pull_quote_order_idx" ON "pages_blocks_mfh_pull_quote" USING btree ("_order");
  CREATE INDEX "pages_blocks_mfh_pull_quote_parent_id_idx" ON "pages_blocks_mfh_pull_quote" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_mfh_pull_quote_path_idx" ON "pages_blocks_mfh_pull_quote" USING btree ("_path");
  CREATE INDEX "pages_blocks_mfh_authority_order_idx" ON "pages_blocks_mfh_authority" USING btree ("_order");
  CREATE INDEX "pages_blocks_mfh_authority_parent_id_idx" ON "pages_blocks_mfh_authority" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_mfh_authority_path_idx" ON "pages_blocks_mfh_authority" USING btree ("_path");
  CREATE INDEX "pages_blocks_mfh_authority_image_idx" ON "pages_blocks_mfh_authority" USING btree ("image_id");
  CREATE INDEX "pages_blocks_mfh_buy_band_perks_order_idx" ON "pages_blocks_mfh_buy_band_perks" USING btree ("_order");
  CREATE INDEX "pages_blocks_mfh_buy_band_perks_parent_id_idx" ON "pages_blocks_mfh_buy_band_perks" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_mfh_buy_band_order_idx" ON "pages_blocks_mfh_buy_band" USING btree ("_order");
  CREATE INDEX "pages_blocks_mfh_buy_band_parent_id_idx" ON "pages_blocks_mfh_buy_band" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_mfh_buy_band_path_idx" ON "pages_blocks_mfh_buy_band" USING btree ("_path");
  CREATE INDEX "pages_blocks_mfh_deep_pitch_order_idx" ON "pages_blocks_mfh_deep_pitch" USING btree ("_order");
  CREATE INDEX "pages_blocks_mfh_deep_pitch_parent_id_idx" ON "pages_blocks_mfh_deep_pitch" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_mfh_deep_pitch_path_idx" ON "pages_blocks_mfh_deep_pitch" USING btree ("_path");
  CREATE INDEX "pages_blocks_geo_hero_order_idx" ON "pages_blocks_geo_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_geo_hero_parent_id_idx" ON "pages_blocks_geo_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_geo_hero_path_idx" ON "pages_blocks_geo_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_geo_what_is_order_idx" ON "pages_blocks_geo_what_is" USING btree ("_order");
  CREATE INDEX "pages_blocks_geo_what_is_parent_id_idx" ON "pages_blocks_geo_what_is" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_geo_what_is_path_idx" ON "pages_blocks_geo_what_is" USING btree ("_path");
  CREATE INDEX "pages_blocks_geo_technique_grid_cards_order_idx" ON "pages_blocks_geo_technique_grid_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_geo_technique_grid_cards_parent_id_idx" ON "pages_blocks_geo_technique_grid_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_geo_technique_grid_order_idx" ON "pages_blocks_geo_technique_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_geo_technique_grid_parent_id_idx" ON "pages_blocks_geo_technique_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_geo_technique_grid_path_idx" ON "pages_blocks_geo_technique_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_geo_closing_cta_secondary_cards_order_idx" ON "pages_blocks_geo_closing_cta_secondary_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_geo_closing_cta_secondary_cards_parent_id_idx" ON "pages_blocks_geo_closing_cta_secondary_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_geo_closing_cta_order_idx" ON "pages_blocks_geo_closing_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_geo_closing_cta_parent_id_idx" ON "pages_blocks_geo_closing_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_geo_closing_cta_path_idx" ON "pages_blocks_geo_closing_cta" USING btree ("_path");`)
}
