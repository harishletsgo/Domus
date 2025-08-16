CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" varchar(100),
	"owner_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"property_type" varchar(20) NOT NULL,
	"country" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"zip_code" varchar(20) NOT NULL,
	"street_address" varchar(255) NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"square_footage" integer NOT NULL,
	"bedrooms" integer,
	"bathrooms" numeric(3, 1),
	"year_built" integer NOT NULL,
	"lot_size" integer,
	"parking_spaces" integer,
	"price_eth" numeric(20, 8) NOT NULL,
	"price_usd" numeric(15, 2),
	"parcel_id" varchar(100) NOT NULL,
	"deed_number" varchar(100) NOT NULL,
	"zoning" varchar(100) NOT NULL,
	"tax_assessment" numeric(15, 2) NOT NULL,
	"utilities" jsonb,
	"features" jsonb,
	"chain_id" integer,
	"contract_address" varchar(42),
	"transaction_hash" varchar(66),
	"walrus_hash" varchar(100),
	"is_listed" boolean DEFAULT true,
	"is_verified" boolean DEFAULT false,
	"is_public" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"listed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "property_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"mime_type" varchar(100),
	"file_size" integer,
	"walrus_hash" varchar(100) NOT NULL,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"walrus_hash" varchar(100),
	"alt" varchar(255),
	"is_primary" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"user_id" uuid,
	"ip_address" varchar(45),
	"user_agent" text,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"search_query" text NOT NULL,
	"filters" jsonb,
	"results_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"user_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_favorites_user_id_property_id_pk" PRIMARY KEY("user_id","property_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"privy_id" varchar(255) NOT NULL,
	"email" varchar(255),
	"wallet_address" varchar(42),
	"display_name" varchar(100),
	"profile_image" text,
	"auth_method" varchar(50),
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_privy_id_unique" UNIQUE("privy_id")
);
--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_views" ADD CONSTRAINT "property_views_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_views" ADD CONSTRAINT "property_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "owner_id_idx" ON "properties" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "token_id_idx" ON "properties" USING btree ("token_id");--> statement-breakpoint
CREATE INDEX "property_type_idx" ON "properties" USING btree ("property_type");--> statement-breakpoint
CREATE INDEX "city_idx" ON "properties" USING btree ("city");--> statement-breakpoint
CREATE INDEX "state_idx" ON "properties" USING btree ("state");--> statement-breakpoint
CREATE INDEX "price_eth_idx" ON "properties" USING btree ("price_eth");--> statement-breakpoint
CREATE INDEX "is_listed_idx" ON "properties" USING btree ("is_listed");--> statement-breakpoint
CREATE INDEX "is_public_idx" ON "properties" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "is_featured_idx" ON "properties" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "created_at_idx" ON "properties" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "property_documents_property_id_idx" ON "property_documents" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "property_documents_file_type_idx" ON "property_documents" USING btree ("file_type");--> statement-breakpoint
CREATE INDEX "property_images_property_id_idx" ON "property_images" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "property_images_is_primary_idx" ON "property_images" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX "property_views_property_id_idx" ON "property_views" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "property_views_user_id_idx" ON "property_views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "property_views_viewed_at_idx" ON "property_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "search_history_user_id_idx" ON "search_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "search_history_created_at_idx" ON "search_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_favorites_user_id_idx" ON "user_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_favorites_property_id_idx" ON "user_favorites" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "privy_id_idx" ON "users" USING btree ("privy_id");--> statement-breakpoint
CREATE INDEX "wallet_address_idx" ON "users" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "email_idx" ON "users" USING btree ("email");