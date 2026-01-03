-- CreateTable
CREATE TABLE "race_tracks" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" INTEGER NOT NULL,
    "location" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "race_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "races" (
    "id" SERIAL NOT NULL,
    "race_date" DATE NOT NULL,
    "race_number" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,
    "distance" INTEGER NOT NULL,
    "surface_type" VARCHAR(50) NOT NULL,
    "weather" VARCHAR(50),
    "track_condition" VARCHAR(50),
    "race_class" VARCHAR(50),
    "prize_money" DECIMAL(15,2),
    "race_status" VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "races_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horses" (
    "id" SERIAL NOT NULL,
    "registration_number" VARCHAR(50) NOT NULL,
    "name_ko" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "birth_date" DATE NOT NULL,
    "gender" VARCHAR(20) NOT NULL,
    "rating" INTEGER,
    "total_races" INTEGER NOT NULL DEFAULT 0,
    "total_wins" INTEGER NOT NULL DEFAULT 0,
    "total_places" INTEGER NOT NULL DEFAULT 0,
    "total_shows" INTEGER NOT NULL DEFAULT 0,
    "total_earnings" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jockeys" (
    "id" SERIAL NOT NULL,
    "license_number" VARCHAR(50) NOT NULL,
    "name_ko" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "debut_date" DATE,
    "total_races" INTEGER NOT NULL DEFAULT 0,
    "total_wins" INTEGER NOT NULL DEFAULT 0,
    "win_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "place_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jockeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainers" (
    "id" SERIAL NOT NULL,
    "license_number" VARCHAR(50) NOT NULL,
    "name_ko" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "stable_name" VARCHAR(100),
    "total_races" INTEGER NOT NULL DEFAULT 0,
    "total_wins" INTEGER NOT NULL DEFAULT 0,
    "win_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "race_entries" (
    "id" SERIAL NOT NULL,
    "race_id" INTEGER NOT NULL,
    "horse_id" INTEGER NOT NULL,
    "jockey_id" INTEGER NOT NULL,
    "trainer_id" INTEGER NOT NULL,
    "gate_number" INTEGER NOT NULL,
    "horse_weight_kg" DECIMAL(5,2),
    "jockey_weight_kg" DECIMAL(5,2),
    "odds" DECIMAL(10,2),
    "finish_position" INTEGER,
    "finish_time" DECIMAL(10,3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "race_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" SERIAL NOT NULL,
    "race_id" INTEGER NOT NULL,
    "prediction_type" VARCHAR(50) NOT NULL,
    "prediction_data" JSONB NOT NULL,
    "confidence_score" DECIMAL(5,4) NOT NULL,
    "llm_model_version" VARCHAR(100) NOT NULL,
    "llm_reasoning" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "race_tracks_code_key" ON "race_tracks"("code");

-- CreateIndex
CREATE INDEX "races_race_date_idx" ON "races"("race_date");

-- CreateIndex
CREATE INDEX "races_race_status_idx" ON "races"("race_status");

-- CreateIndex
CREATE UNIQUE INDEX "races_race_date_race_number_track_id_key" ON "races"("race_date", "race_number", "track_id");

-- CreateIndex
CREATE UNIQUE INDEX "horses_registration_number_key" ON "horses"("registration_number");

-- CreateIndex
CREATE INDEX "horses_name_ko_idx" ON "horses"("name_ko");

-- CreateIndex
CREATE UNIQUE INDEX "jockeys_license_number_key" ON "jockeys"("license_number");

-- CreateIndex
CREATE INDEX "jockeys_name_ko_idx" ON "jockeys"("name_ko");

-- CreateIndex
CREATE UNIQUE INDEX "trainers_license_number_key" ON "trainers"("license_number");

-- CreateIndex
CREATE INDEX "trainers_name_ko_idx" ON "trainers"("name_ko");

-- CreateIndex
CREATE INDEX "race_entries_race_id_idx" ON "race_entries"("race_id");

-- CreateIndex
CREATE INDEX "race_entries_horse_id_idx" ON "race_entries"("horse_id");

-- CreateIndex
CREATE UNIQUE INDEX "race_entries_race_id_horse_id_key" ON "race_entries"("race_id", "horse_id");

-- CreateIndex
CREATE INDEX "predictions_race_id_idx" ON "predictions"("race_id");

-- CreateIndex
CREATE INDEX "predictions_prediction_type_idx" ON "predictions"("prediction_type");

-- AddForeignKey
ALTER TABLE "races" ADD CONSTRAINT "races_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "race_tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_entries" ADD CONSTRAINT "race_entries_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "races"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_entries" ADD CONSTRAINT "race_entries_horse_id_fkey" FOREIGN KEY ("horse_id") REFERENCES "horses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_entries" ADD CONSTRAINT "race_entries_jockey_id_fkey" FOREIGN KEY ("jockey_id") REFERENCES "jockeys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_entries" ADD CONSTRAINT "race_entries_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "races"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
