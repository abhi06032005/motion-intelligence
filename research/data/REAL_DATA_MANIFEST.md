# MotionIQ: Verified Real Human Data Manifest (UI-PRMD Deep Squat)

## 1. Dataset Provenance & Academic Citation

- **Primary Source**: University of Idaho Physical Rehabilitation Movement Dataset (UI-PRMD)
- **Primary Publication**: Vakanski, A., Jun, H. P., Paul, S., & Baker, R. (2018). *A Data Set of Human Body Movements for Physical Rehabilitation Exercises*. Data, 3(1), 2. https://doi.org/10.3390/data3010002
- **Capture Modality**: Vicon Optical Motion Capture System (8 cameras, 100 Hz capture rate)
- **Marker Topology**: 39 optical reflective markers / Cartesian joint centers (117 floating-point values per frame)
- **Movement Selected**: Exercise `m01` — Deep Squat
- **Subjects**: 10 distinct healthy human subjects (`Subject_01` to `Subject_10`)
- **License**: Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Ingestion Hash Verification**: All SHA-256 hashes generated from authentic source files.

## 2. Ingestion Summary

- **Total Authentic Recordings Ingested**: 200
- **Optimal / Correct Technique Recordings**: 100
- **Non-Optimal / Incorrect Technique Recordings**: 100
- **Total Captured Kinematic Frames**: 55,179
- **Total Cumulative Recording Duration**: 551.8 seconds (9.20 minutes at 100 Hz)

## 3. Split Partitioning Strategy (Subject-Disjoint)

- **Training Split (60%)**: `Subject_01` through `Subject_06` (120 trials)
- **Validation Split (20%)**: `Subject_07` and `Subject_08` (40 trials)
- **Test Split (20%)**: `Subject_09` and `Subject_10` (40 trials)
*Zero subject overlap between training/calibration and holdout test partitions.*

## 4. File-by-File Cryptographic Provenance

| Filename | Subject | Trial | Protocol | Frames | Duration | File Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `m01_s01_e01_positions_inc.txt` | Subject_01 | trial_01 | `non_optimal` | 217 | 2.17s | 292,657 B | `199ba06afe67685e...` |
| `m01_s01_e01_positions.txt` | Subject_01 | trial_01 | `optimal` | 191 | 1.91s | 255,631 B | `71997ef8d97d072e...` |
| `m01_s01_e02_positions_inc.txt` | Subject_01 | trial_02 | `non_optimal` | 218 | 2.18s | 293,634 B | `9672582d706f0056...` |
| `m01_s01_e02_positions.txt` | Subject_01 | trial_02 | `optimal` | 219 | 2.19s | 293,553 B | `9ed25f002b98af00...` |
| `m01_s01_e03_positions_inc.txt` | Subject_01 | trial_03 | `non_optimal` | 218 | 2.18s | 293,926 B | `b01da9f0d9ec1f0c...` |
| `m01_s01_e03_positions.txt` | Subject_01 | trial_03 | `optimal` | 227 | 2.27s | 304,156 B | `23c69a2b225b1964...` |
| `m01_s01_e04_positions_inc.txt` | Subject_01 | trial_04 | `non_optimal` | 253 | 2.53s | 339,801 B | `cf7c7bc10e192c15...` |
| `m01_s01_e04_positions.txt` | Subject_01 | trial_04 | `optimal` | 222 | 2.22s | 298,043 B | `33231c0910775237...` |
| `m01_s01_e05_positions_inc.txt` | Subject_01 | trial_05 | `non_optimal` | 249 | 2.49s | 333,880 B | `9cebbb663d037189...` |
| `m01_s01_e05_positions.txt` | Subject_01 | trial_05 | `optimal` | 224 | 2.24s | 300,454 B | `57b143496dd0647a...` |
| `m01_s01_e06_positions_inc.txt` | Subject_01 | trial_06 | `non_optimal` | 264 | 2.64s | 354,278 B | `3d00c70249b6c963...` |
| `m01_s01_e06_positions.txt` | Subject_01 | trial_06 | `optimal` | 220 | 2.2s | 295,129 B | `59459f288b83e12f...` |
| `m01_s01_e07_positions_inc.txt` | Subject_01 | trial_07 | `non_optimal` | 265 | 2.65s | 354,707 B | `96aba8a203fa59c3...` |
| `m01_s01_e07_positions.txt` | Subject_01 | trial_07 | `optimal` | 223 | 2.23s | 299,160 B | `80b158e084ea99ef...` |
| `m01_s01_e08_positions_inc.txt` | Subject_01 | trial_08 | `non_optimal` | 310 | 3.1s | 414,829 B | `652f9190c037d0d1...` |
| `m01_s01_e08_positions.txt` | Subject_01 | trial_08 | `optimal` | 213 | 2.13s | 285,255 B | `21aac30cd1fd1a58...` |
| `m01_s01_e09_positions_inc.txt` | Subject_01 | trial_09 | `non_optimal` | 318 | 3.18s | 425,451 B | `6ebc7c118c62ddfd...` |
| `m01_s01_e09_positions.txt` | Subject_01 | trial_09 | `optimal` | 216 | 2.16s | 289,227 B | `b0e2e4935bed74ee...` |
| `m01_s01_e10_positions_inc.txt` | Subject_01 | trial_10 | `non_optimal` | 462 | 4.62s | 621,675 B | `9a860b9f4a1ff09a...` |
| `m01_s01_e10_positions.txt` | Subject_01 | trial_10 | `optimal` | 225 | 2.25s | 301,566 B | `29df6db82ac23e66...` |
| `m01_s02_e01_positions_inc.txt` | Subject_02 | trial_01 | `non_optimal` | 281 | 2.81s | 377,359 B | `c677eb569d842575...` |
| `m01_s02_e01_positions.txt` | Subject_02 | trial_01 | `optimal` | 222 | 2.22s | 297,703 B | `bf2094c35db2b483...` |
| `m01_s02_e02_positions_inc.txt` | Subject_02 | trial_02 | `non_optimal` | 301 | 3.01s | 404,156 B | `d4f0874012796ab8...` |
| `m01_s02_e02_positions.txt` | Subject_02 | trial_02 | `optimal` | 246 | 2.46s | 330,401 B | `f6dcddd66133cc11...` |
| `m01_s02_e03_positions_inc.txt` | Subject_02 | trial_03 | `non_optimal` | 300 | 3.0s | 403,946 B | `e4f753b6019284f1...` |
| `m01_s02_e03_positions.txt` | Subject_02 | trial_03 | `optimal` | 249 | 2.49s | 335,261 B | `c24622b34d115bb2...` |
| `m01_s02_e04_positions_inc.txt` | Subject_02 | trial_04 | `non_optimal` | 310 | 3.1s | 416,946 B | `674a73c892f3b8dd...` |
| `m01_s02_e04_positions.txt` | Subject_02 | trial_04 | `optimal` | 246 | 2.46s | 331,215 B | `5f68a884b23eb743...` |
| `m01_s02_e05_positions_inc.txt` | Subject_02 | trial_05 | `non_optimal` | 336 | 3.36s | 450,974 B | `743e35678fc02d28...` |
| `m01_s02_e05_positions.txt` | Subject_02 | trial_05 | `optimal` | 256 | 2.56s | 344,300 B | `783cadb7d99b2582...` |
| `m01_s02_e06_positions_inc.txt` | Subject_02 | trial_06 | `non_optimal` | 301 | 3.01s | 403,598 B | `defe6beb0f8a40c4...` |
| `m01_s02_e06_positions.txt` | Subject_02 | trial_06 | `optimal` | 234 | 2.34s | 314,455 B | `5494a79f81838bac...` |
| `m01_s02_e07_positions_inc.txt` | Subject_02 | trial_07 | `non_optimal` | 311 | 3.11s | 416,365 B | `d75434ba6a2c7946...` |
| `m01_s02_e07_positions.txt` | Subject_02 | trial_07 | `optimal` | 261 | 2.61s | 351,014 B | `da9349e0f0813d41...` |
| `m01_s02_e08_positions_inc.txt` | Subject_02 | trial_08 | `non_optimal` | 280 | 2.8s | 374,969 B | `af1551df16d557fe...` |
| `m01_s02_e08_positions.txt` | Subject_02 | trial_08 | `optimal` | 235 | 2.35s | 315,587 B | `9ef1a48a01ebd63b...` |
| `m01_s02_e09_positions_inc.txt` | Subject_02 | trial_09 | `non_optimal` | 337 | 3.37s | 451,256 B | `61273d241386cee1...` |
| `m01_s02_e09_positions.txt` | Subject_02 | trial_09 | `optimal` | 233 | 2.33s | 312,812 B | `cd0eea1102bf245d...` |
| `m01_s02_e10_positions_inc.txt` | Subject_02 | trial_10 | `non_optimal` | 310 | 3.1s | 414,149 B | `e138ea6f9f3f28a2...` |
| `m01_s02_e10_positions.txt` | Subject_02 | trial_10 | `optimal` | 240 | 2.4s | 322,643 B | `7d419b965e1348b0...` |
| `m01_s03_e01_positions_inc.txt` | Subject_03 | trial_01 | `non_optimal` | 371 | 3.71s | 501,951 B | `ebfd52c91e6e1568...` |
| `m01_s03_e01_positions.txt` | Subject_03 | trial_01 | `optimal` | 253 | 2.53s | 342,236 B | `c2f41873a7f1cc9c...` |
| `m01_s03_e02_positions_inc.txt` | Subject_03 | trial_02 | `non_optimal` | 296 | 2.96s | 399,665 B | `fa7d78ec04f2d8ea...` |
| `m01_s03_e02_positions.txt` | Subject_03 | trial_02 | `optimal` | 276 | 2.76s | 373,359 B | `6bfce89292597393...` |
| `m01_s03_e03_positions_inc.txt` | Subject_03 | trial_03 | `non_optimal` | 328 | 3.28s | 442,213 B | `b06ce18ef364756a...` |
| `m01_s03_e03_positions.txt` | Subject_03 | trial_03 | `optimal` | 272 | 2.72s | 367,984 B | `6b6107e2663621b9...` |
| `m01_s03_e04_positions_inc.txt` | Subject_03 | trial_04 | `non_optimal` | 411 | 4.11s | 556,100 B | `3451bfbf341bdb0c...` |
| `m01_s03_e04_positions.txt` | Subject_03 | trial_04 | `optimal` | 282 | 2.82s | 381,742 B | `34c87237e8991007...` |
| `m01_s03_e05_positions_inc.txt` | Subject_03 | trial_05 | `non_optimal` | 410 | 4.1s | 553,616 B | `b0aa4af6c5507f25...` |
| `m01_s03_e05_positions.txt` | Subject_03 | trial_05 | `optimal` | 271 | 2.71s | 367,192 B | `c12eead7064f64b3...` |
| `m01_s03_e06_positions_inc.txt` | Subject_03 | trial_06 | `non_optimal` | 379 | 3.79s | 513,190 B | `2d4355f4d2809bb5...` |
| `m01_s03_e06_positions.txt` | Subject_03 | trial_06 | `optimal` | 286 | 2.86s | 387,210 B | `4ff2b8eb2f8cd366...` |
| `m01_s03_e07_positions_inc.txt` | Subject_03 | trial_07 | `non_optimal` | 385 | 3.85s | 520,736 B | `edcb8d58fc07d197...` |
| `m01_s03_e07_positions.txt` | Subject_03 | trial_07 | `optimal` | 263 | 2.63s | 356,298 B | `7c58362954d9de08...` |
| `m01_s03_e08_positions_inc.txt` | Subject_03 | trial_08 | `non_optimal` | 380 | 3.8s | 516,236 B | `209ddc195ceb87fe...` |
| `m01_s03_e08_positions.txt` | Subject_03 | trial_08 | `optimal` | 268 | 2.68s | 363,276 B | `e179b79f9bffaa6b...` |
| `m01_s03_e09_positions_inc.txt` | Subject_03 | trial_09 | `non_optimal` | 361 | 3.61s | 489,139 B | `2542a5842c81a2e3...` |
| `m01_s03_e09_positions.txt` | Subject_03 | trial_09 | `optimal` | 275 | 2.75s | 372,442 B | `4b88898a9f6627b7...` |
| `m01_s03_e10_positions_inc.txt` | Subject_03 | trial_10 | `non_optimal` | 392 | 3.92s | 529,205 B | `9f29e72de973dff3...` |
| `m01_s03_e10_positions.txt` | Subject_03 | trial_10 | `optimal` | 270 | 2.7s | 365,885 B | `3dc8979985d83f75...` |
| `m01_s04_e01_positions_inc.txt` | Subject_04 | trial_01 | `non_optimal` | 224 | 2.24s | 302,199 B | `7e587e12caf81e9c...` |
| `m01_s04_e01_positions.txt` | Subject_04 | trial_01 | `optimal` | 203 | 2.03s | 273,110 B | `34b763c10c314950...` |
| `m01_s04_e02_positions_inc.txt` | Subject_04 | trial_02 | `non_optimal` | 303 | 3.03s | 409,946 B | `a7ed16d8d72ff67a...` |
| `m01_s04_e02_positions.txt` | Subject_04 | trial_02 | `optimal` | 227 | 2.27s | 305,062 B | `9156431edc1d170e...` |
| `m01_s04_e03_positions_inc.txt` | Subject_04 | trial_03 | `non_optimal` | 242 | 2.42s | 326,305 B | `6a71524ce20eeb25...` |
| `m01_s04_e03_positions.txt` | Subject_04 | trial_03 | `optimal` | 234 | 2.34s | 314,666 B | `db94c8556b80c87e...` |
| `m01_s04_e04_positions_inc.txt` | Subject_04 | trial_04 | `non_optimal` | 274 | 2.74s | 369,167 B | `924a0e7360898ca7...` |
| `m01_s04_e04_positions.txt` | Subject_04 | trial_04 | `optimal` | 236 | 2.36s | 317,548 B | `5c785e5a76534cf9...` |
| `m01_s04_e05_positions_inc.txt` | Subject_04 | trial_05 | `non_optimal` | 393 | 3.93s | 532,349 B | `a06b2719b4461bb8...` |
| `m01_s04_e05_positions.txt` | Subject_04 | trial_05 | `optimal` | 243 | 2.43s | 327,441 B | `664c3a57acf514c5...` |
| `m01_s04_e06_positions_inc.txt` | Subject_04 | trial_06 | `non_optimal` | 336 | 3.36s | 449,974 B | `44b12980d9df0d3c...` |
| `m01_s04_e06_positions.txt` | Subject_04 | trial_06 | `optimal` | 230 | 2.3s | 309,791 B | `aa2786c46b2b1130...` |
| `m01_s04_e07_positions_inc.txt` | Subject_04 | trial_07 | `non_optimal` | 277 | 2.77s | 372,419 B | `424b5b517f448696...` |
| `m01_s04_e07_positions.txt` | Subject_04 | trial_07 | `optimal` | 226 | 2.26s | 303,864 B | `89e817d944d793b4...` |
| `m01_s04_e08_positions_inc.txt` | Subject_04 | trial_08 | `non_optimal` | 252 | 2.52s | 338,694 B | `029f591a73c0e7eb...` |
| `m01_s04_e08_positions.txt` | Subject_04 | trial_08 | `optimal` | 227 | 2.27s | 304,980 B | `27c043930172f331...` |
| `m01_s04_e09_positions_inc.txt` | Subject_04 | trial_09 | `non_optimal` | 531 | 5.31s | 715,150 B | `aabe08733643dafa...` |
| `m01_s04_e09_positions.txt` | Subject_04 | trial_09 | `optimal` | 226 | 2.26s | 303,421 B | `f6ee52fd6fca1dfe...` |
| `m01_s04_e10_positions_inc.txt` | Subject_04 | trial_10 | `non_optimal` | 330 | 3.3s | 445,781 B | `b913cdb41bb2331c...` |
| `m01_s04_e10_positions.txt` | Subject_04 | trial_10 | `optimal` | 233 | 2.33s | 313,172 B | `292269b40c653dc6...` |
| `m01_s05_e01_positions_inc.txt` | Subject_05 | trial_01 | `non_optimal` | 265 | 2.65s | 351,070 B | `c9d1013b80fc05c2...` |
| `m01_s05_e01_positions.txt` | Subject_05 | trial_01 | `optimal` | 339 | 3.39s | 449,948 B | `47036d8599ef8246...` |
| `m01_s05_e02_positions_inc.txt` | Subject_05 | trial_02 | `non_optimal` | 288 | 2.88s | 383,280 B | `40c218b09ddcf3e6...` |
| `m01_s05_e02_positions.txt` | Subject_05 | trial_02 | `optimal` | 328 | 3.28s | 435,646 B | `6015627f0a7b7fd5...` |
| `m01_s05_e03_positions_inc.txt` | Subject_05 | trial_03 | `non_optimal` | 264 | 2.64s | 351,837 B | `60e5ba8631b05820...` |
| `m01_s05_e03_positions.txt` | Subject_05 | trial_03 | `optimal` | 305 | 3.05s | 405,473 B | `db123c13387ccc09...` |
| `m01_s05_e04_positions_inc.txt` | Subject_05 | trial_04 | `non_optimal` | 314 | 3.14s | 415,940 B | `26e76dda92af0cce...` |
| `m01_s05_e04_positions.txt` | Subject_05 | trial_04 | `optimal` | 301 | 3.01s | 399,852 B | `e635bb584ec9aa6e...` |
| `m01_s05_e05_positions_inc.txt` | Subject_05 | trial_05 | `non_optimal` | 316 | 3.16s | 419,862 B | `e9b54c01845e0108...` |
| `m01_s05_e05_positions.txt` | Subject_05 | trial_05 | `optimal` | 287 | 2.87s | 381,098 B | `307024510881d992...` |
| `m01_s05_e06_positions_inc.txt` | Subject_05 | trial_06 | `non_optimal` | 325 | 3.25s | 432,441 B | `50e1435ea7d27250...` |
| `m01_s05_e06_positions.txt` | Subject_05 | trial_06 | `optimal` | 281 | 2.81s | 373,394 B | `3a87a6880070876c...` |
| `m01_s05_e07_positions_inc.txt` | Subject_05 | trial_07 | `non_optimal` | 317 | 3.17s | 421,623 B | `4d5f8a7a95777068...` |
| `m01_s05_e07_positions.txt` | Subject_05 | trial_07 | `optimal` | 289 | 2.89s | 384,560 B | `b49da03d743eaf0d...` |
| `m01_s05_e08_positions_inc.txt` | Subject_05 | trial_08 | `non_optimal` | 331 | 3.31s | 440,624 B | `9a14e45c5151703a...` |
| `m01_s05_e08_positions.txt` | Subject_05 | trial_08 | `optimal` | 272 | 2.72s | 361,406 B | `f5ee85cf422cebfb...` |
| `m01_s05_e09_positions_inc.txt` | Subject_05 | trial_09 | `non_optimal` | 297 | 2.97s | 394,613 B | `42dc519d78e8b2cf...` |
| `m01_s05_e09_positions.txt` | Subject_05 | trial_09 | `optimal` | 280 | 2.8s | 372,054 B | `dec77d29bb30c663...` |
| `m01_s05_e10_positions_inc.txt` | Subject_05 | trial_10 | `non_optimal` | 320 | 3.2s | 427,067 B | `dc811259ea951b13...` |
| `m01_s05_e10_positions.txt` | Subject_05 | trial_10 | `optimal` | 275 | 2.75s | 365,229 B | `f2c3f1215cfb4844...` |
| `m01_s06_e01_positions_inc.txt` | Subject_06 | trial_01 | `non_optimal` | 271 | 2.71s | 357,111 B | `840b566e28d3bfeb...` |
| `m01_s06_e01_positions.txt` | Subject_06 | trial_01 | `optimal` | 268 | 2.68s | 361,515 B | `a7284bf5511e877c...` |
| `m01_s06_e02_positions_inc.txt` | Subject_06 | trial_02 | `non_optimal` | 284 | 2.84s | 374,430 B | `7f6193f165263204...` |
| `m01_s06_e02_positions.txt` | Subject_06 | trial_02 | `optimal` | 261 | 2.61s | 351,779 B | `ddeab8b7e5348341...` |
| `m01_s06_e03_positions_inc.txt` | Subject_06 | trial_03 | `non_optimal` | 268 | 2.68s | 353,127 B | `1b5db9fd0df91d9c...` |
| `m01_s06_e03_positions.txt` | Subject_06 | trial_03 | `optimal` | 287 | 2.87s | 386,753 B | `801841316b28c9b1...` |
| `m01_s06_e04_positions_inc.txt` | Subject_06 | trial_04 | `non_optimal` | 257 | 2.57s | 340,136 B | `4f698fd94aaa58c2...` |
| `m01_s06_e04_positions.txt` | Subject_06 | trial_04 | `optimal` | 296 | 2.96s | 399,028 B | `bdab6e71ac260004...` |
| `m01_s06_e05_positions_inc.txt` | Subject_06 | trial_05 | `non_optimal` | 331 | 3.31s | 437,564 B | `8936a9ddc190ea85...` |
| `m01_s06_e05_positions.txt` | Subject_06 | trial_05 | `optimal` | 305 | 3.05s | 411,044 B | `97eb2358355daeaf...` |
| `m01_s06_e06_positions_inc.txt` | Subject_06 | trial_06 | `non_optimal` | 286 | 2.86s | 376,992 B | `69aab9bdb834092d...` |
| `m01_s06_e06_positions.txt` | Subject_06 | trial_06 | `optimal` | 291 | 2.91s | 392,497 B | `426b5051ae626891...` |
| `m01_s06_e07_positions_inc.txt` | Subject_06 | trial_07 | `non_optimal` | 277 | 2.77s | 364,334 B | `911818f7d9be9a81...` |
| `m01_s06_e07_positions.txt` | Subject_06 | trial_07 | `optimal` | 286 | 2.86s | 385,297 B | `44419c502b8256f0...` |
| `m01_s06_e08_positions_inc.txt` | Subject_06 | trial_08 | `non_optimal` | 296 | 2.96s | 389,872 B | `7cec8ae707155586...` |
| `m01_s06_e08_positions.txt` | Subject_06 | trial_08 | `optimal` | 273 | 2.73s | 368,370 B | `e20bb24eae0c1ff7...` |
| `m01_s06_e09_positions_inc.txt` | Subject_06 | trial_09 | `non_optimal` | 284 | 2.84s | 375,353 B | `83b31612791070a8...` |
| `m01_s06_e09_positions.txt` | Subject_06 | trial_09 | `optimal` | 275 | 2.75s | 370,340 B | `d283ab82433e38f1...` |
| `m01_s06_e10_positions_inc.txt` | Subject_06 | trial_10 | `non_optimal` | 310 | 3.1s | 409,758 B | `3ad1dcc5c886f57d...` |
| `m01_s06_e10_positions.txt` | Subject_06 | trial_10 | `optimal` | 270 | 2.7s | 363,784 B | `ca8ca5af88f1cdb5...` |
| `m01_s07_e01_positions_inc.txt` | Subject_07 | trial_01 | `non_optimal` | 225 | 2.25s | 301,524 B | `c39424ad265c0465...` |
| `m01_s07_e01_positions.txt` | Subject_07 | trial_01 | `optimal` | 414 | 4.14s | 554,474 B | `610cb37918d9af77...` |
| `m01_s07_e02_positions_inc.txt` | Subject_07 | trial_02 | `non_optimal` | 221 | 2.21s | 298,569 B | `7390fbcbc7b6cc57...` |
| `m01_s07_e02_positions.txt` | Subject_07 | trial_02 | `optimal` | 423 | 4.23s | 565,864 B | `7c30809ed31cce92...` |
| `m01_s07_e03_positions_inc.txt` | Subject_07 | trial_03 | `non_optimal` | 248 | 2.48s | 332,808 B | `3aad5b0e1ef07b4f...` |
| `m01_s07_e03_positions.txt` | Subject_07 | trial_03 | `optimal` | 388 | 3.88s | 519,052 B | `576db5042d4be8fb...` |
| `m01_s07_e04_positions_inc.txt` | Subject_07 | trial_04 | `non_optimal` | 114 | 1.14s | 151,965 B | `25d200967214754a...` |
| `m01_s07_e04_positions.txt` | Subject_07 | trial_04 | `optimal` | 375 | 3.75s | 501,905 B | `4f6034cd6e44545d...` |
| `m01_s07_e05_positions_inc.txt` | Subject_07 | trial_05 | `non_optimal` | 357 | 3.57s | 478,404 B | `a08fd81a4470f293...` |
| `m01_s07_e05_positions.txt` | Subject_07 | trial_05 | `optimal` | 379 | 3.79s | 507,226 B | `e7c2c2fa50ea2cb6...` |
| `m01_s07_e06_positions_inc.txt` | Subject_07 | trial_06 | `non_optimal` | 281 | 2.81s | 375,773 B | `62c9e22ff011a3b9...` |
| `m01_s07_e06_positions.txt` | Subject_07 | trial_06 | `optimal` | 395 | 3.95s | 528,999 B | `1fd801603a5f6aeb...` |
| `m01_s07_e07_positions_inc.txt` | Subject_07 | trial_07 | `non_optimal` | 299 | 2.99s | 400,372 B | `2fc16a192783a283...` |
| `m01_s07_e07_positions.txt` | Subject_07 | trial_07 | `optimal` | 379 | 3.79s | 507,321 B | `7e57542cd92a5a03...` |
| `m01_s07_e08_positions_inc.txt` | Subject_07 | trial_08 | `non_optimal` | 250 | 2.5s | 334,385 B | `a7fcc5c9ff6b6598...` |
| `m01_s07_e08_positions.txt` | Subject_07 | trial_08 | `optimal` | 378 | 3.78s | 506,546 B | `3f7a763c4af1ec9f...` |
| `m01_s07_e09_positions_inc.txt` | Subject_07 | trial_09 | `non_optimal` | 289 | 2.89s | 386,277 B | `0a2c9ded37b0ca6f...` |
| `m01_s07_e09_positions.txt` | Subject_07 | trial_09 | `optimal` | 374 | 3.74s | 500,603 B | `50dd662fa6ce1588...` |
| `m01_s07_e10_positions_inc.txt` | Subject_07 | trial_10 | `non_optimal` | 280 | 2.8s | 377,547 B | `df7ce422b9c19310...` |
| `m01_s07_e10_positions.txt` | Subject_07 | trial_10 | `optimal` | 360 | 3.6s | 482,121 B | `21ef1aa9c98893fc...` |
| `m01_s08_e01_positions_inc.txt` | Subject_08 | trial_01 | `non_optimal` | 200 | 2.0s | 267,973 B | `3a0438bb9945f4be...` |
| `m01_s08_e01_positions.txt` | Subject_08 | trial_01 | `optimal` | 217 | 2.17s | 294,475 B | `32c2aebae1243851...` |
| `m01_s08_e02_positions_inc.txt` | Subject_08 | trial_02 | `non_optimal` | 206 | 2.06s | 275,601 B | `8c86f8f05196074e...` |
| `m01_s08_e02_positions.txt` | Subject_08 | trial_02 | `optimal` | 240 | 2.4s | 325,579 B | `9ee14f5aba1d00ab...` |
| `m01_s08_e03_positions_inc.txt` | Subject_08 | trial_03 | `non_optimal` | 220 | 2.2s | 295,019 B | `3de5a87cb814a205...` |
| `m01_s08_e03_positions.txt` | Subject_08 | trial_03 | `optimal` | 239 | 2.39s | 324,288 B | `ee79cab95f530073...` |
| `m01_s08_e04_positions_inc.txt` | Subject_08 | trial_04 | `non_optimal` | 233 | 2.33s | 311,291 B | `7a12dc09298a72f9...` |
| `m01_s08_e04_positions.txt` | Subject_08 | trial_04 | `optimal` | 236 | 2.36s | 320,193 B | `50ef38c51accecfa...` |
| `m01_s08_e05_positions_inc.txt` | Subject_08 | trial_05 | `non_optimal` | 196 | 1.96s | 262,508 B | `372c64bf71209a72...` |
| `m01_s08_e05_positions.txt` | Subject_08 | trial_05 | `optimal` | 244 | 2.44s | 331,175 B | `6f3f065a17ec58dc...` |
| `m01_s08_e06_positions_inc.txt` | Subject_08 | trial_06 | `non_optimal` | 208 | 2.08s | 278,564 B | `f771a66a8b8d3d26...` |
| `m01_s08_e06_positions.txt` | Subject_08 | trial_06 | `optimal` | 241 | 2.41s | 327,074 B | `0b517396552a75d5...` |
| `m01_s08_e07_positions_inc.txt` | Subject_08 | trial_07 | `non_optimal` | 204 | 2.04s | 273,178 B | `6b3643d72a53c870...` |
| `m01_s08_e07_positions.txt` | Subject_08 | trial_07 | `optimal` | 249 | 2.49s | 337,701 B | `822c28f32ec55be2...` |
| `m01_s08_e08_positions_inc.txt` | Subject_08 | trial_08 | `non_optimal` | 273 | 2.73s | 364,925 B | `0680e28e633779c5...` |
| `m01_s08_e08_positions.txt` | Subject_08 | trial_08 | `optimal` | 237 | 2.37s | 321,194 B | `35db011d372bc742...` |
| `m01_s08_e09_positions_inc.txt` | Subject_08 | trial_09 | `non_optimal` | 223 | 2.23s | 298,271 B | `6706d2942295497b...` |
| `m01_s08_e09_positions.txt` | Subject_08 | trial_09 | `optimal` | 241 | 2.41s | 326,964 B | `ca8e48d269a578ea...` |
| `m01_s08_e10_positions_inc.txt` | Subject_08 | trial_10 | `non_optimal` | 260 | 2.6s | 348,319 B | `337e089f08cac620...` |
| `m01_s08_e10_positions.txt` | Subject_08 | trial_10 | `optimal` | 240 | 2.4s | 325,442 B | `0d1b14b5407d2cf5...` |
| `m01_s09_e01_positions_inc.txt` | Subject_09 | trial_01 | `non_optimal` | 250 | 2.5s | 339,404 B | `62c9507bb17de1fc...` |
| `m01_s09_e01_positions.txt` | Subject_09 | trial_01 | `optimal` | 307 | 3.07s | 415,878 B | `8c2c96be17024f6f...` |
| `m01_s09_e02_positions_inc.txt` | Subject_09 | trial_02 | `non_optimal` | 256 | 2.56s | 347,436 B | `1592a3359793b01b...` |
| `m01_s09_e02_positions.txt` | Subject_09 | trial_02 | `optimal` | 302 | 3.02s | 409,495 B | `8f981445b374201d...` |
| `m01_s09_e03_positions_inc.txt` | Subject_09 | trial_03 | `non_optimal` | 268 | 2.68s | 363,437 B | `711714c06c35f5ec...` |
| `m01_s09_e03_positions.txt` | Subject_09 | trial_03 | `optimal` | 293 | 2.93s | 397,036 B | `5559f5007d4e8768...` |
| `m01_s09_e04_positions_inc.txt` | Subject_09 | trial_04 | `non_optimal` | 290 | 2.9s | 393,601 B | `11584264600c8166...` |
| `m01_s09_e04_positions.txt` | Subject_09 | trial_04 | `optimal` | 283 | 2.83s | 383,746 B | `bf6a47cbac569dad...` |
| `m01_s09_e05_positions_inc.txt` | Subject_09 | trial_05 | `non_optimal` | 210 | 2.1s | 284,967 B | `77566f6c9183386e...` |
| `m01_s09_e05_positions.txt` | Subject_09 | trial_05 | `optimal` | 286 | 2.86s | 387,741 B | `88292027d6573af4...` |
| `m01_s09_e06_positions_inc.txt` | Subject_09 | trial_06 | `non_optimal` | 261 | 2.61s | 353,919 B | `d0a81a7f6e9401f0...` |
| `m01_s09_e06_positions.txt` | Subject_09 | trial_06 | `optimal` | 272 | 2.72s | 368,854 B | `f1c970373d42d255...` |
| `m01_s09_e07_positions_inc.txt` | Subject_09 | trial_07 | `non_optimal` | 270 | 2.7s | 367,145 B | `8cce80c6eb22c745...` |
| `m01_s09_e07_positions.txt` | Subject_09 | trial_07 | `optimal` | 285 | 2.85s | 386,566 B | `ce785f04646d6ef1...` |
| `m01_s09_e08_positions_inc.txt` | Subject_09 | trial_08 | `non_optimal` | 274 | 2.74s | 371,478 B | `5bcd23b80cb063c6...` |
| `m01_s09_e08_positions.txt` | Subject_09 | trial_08 | `optimal` | 312 | 3.12s | 423,091 B | `5dfdd941fc9db048...` |
| `m01_s09_e09_positions_inc.txt` | Subject_09 | trial_09 | `non_optimal` | 225 | 2.25s | 305,751 B | `e86499ea7076062c...` |
| `m01_s09_e09_positions.txt` | Subject_09 | trial_09 | `optimal` | 291 | 2.91s | 394,381 B | `3d73cd49fc30b35e...` |
| `m01_s09_e10_positions_inc.txt` | Subject_09 | trial_10 | `non_optimal` | 215 | 2.15s | 292,207 B | `1c14ec9983568d40...` |
| `m01_s09_e10_positions.txt` | Subject_09 | trial_10 | `optimal` | 300 | 3.0s | 406,907 B | `24b621868000f373...` |
| `m01_s10_e01_positions_inc.txt` | Subject_10 | trial_01 | `non_optimal` | 210 | 2.1s | 275,531 B | `db0d326cdba18342...` |
| `m01_s10_e01_positions.txt` | Subject_10 | trial_01 | `optimal` | 253 | 2.53s | 333,101 B | `a420202fa967ead9...` |
| `m01_s10_e02_positions_inc.txt` | Subject_10 | trial_02 | `non_optimal` | 207 | 2.07s | 272,285 B | `7376c068c1c96490...` |
| `m01_s10_e02_positions.txt` | Subject_10 | trial_02 | `optimal` | 254 | 2.54s | 334,853 B | `70cb443b28bf7b43...` |
| `m01_s10_e03_positions_inc.txt` | Subject_10 | trial_03 | `non_optimal` | 213 | 2.13s | 280,644 B | `717df5e3f9258fb6...` |
| `m01_s10_e03_positions.txt` | Subject_10 | trial_03 | `optimal` | 235 | 2.35s | 309,866 B | `d7cbb2d6cfcb6d75...` |
| `m01_s10_e04_positions_inc.txt` | Subject_10 | trial_04 | `non_optimal` | 231 | 2.31s | 304,449 B | `e1c0e012e4528ca0...` |
| `m01_s10_e04_positions.txt` | Subject_10 | trial_04 | `optimal` | 246 | 2.46s | 324,067 B | `321453ec799a9359...` |
| `m01_s10_e05_positions_inc.txt` | Subject_10 | trial_05 | `non_optimal` | 228 | 2.28s | 300,937 B | `721de423a7d03664...` |
| `m01_s10_e05_positions.txt` | Subject_10 | trial_05 | `optimal` | 246 | 2.46s | 323,811 B | `aac989439e2ac3e8...` |
| `m01_s10_e06_positions_inc.txt` | Subject_10 | trial_06 | `non_optimal` | 224 | 2.24s | 295,770 B | `84dcb860269c994f...` |
| `m01_s10_e06_positions.txt` | Subject_10 | trial_06 | `optimal` | 259 | 2.59s | 341,970 B | `f769af8e5584fd67...` |
| `m01_s10_e07_positions_inc.txt` | Subject_10 | trial_07 | `non_optimal` | 222 | 2.22s | 293,382 B | `d9dfc8c48f8e007d...` |
| `m01_s10_e07_positions.txt` | Subject_10 | trial_07 | `optimal` | 251 | 2.51s | 331,085 B | `ffddc08cf87a5a54...` |
| `m01_s10_e08_positions_inc.txt` | Subject_10 | trial_08 | `non_optimal` | 212 | 2.12s | 280,541 B | `0df3a531b420e9a4...` |
| `m01_s10_e08_positions.txt` | Subject_10 | trial_08 | `optimal` | 258 | 2.58s | 340,186 B | `3a80fed234ae4b4b...` |
| `m01_s10_e09_positions_inc.txt` | Subject_10 | trial_09 | `non_optimal` | 226 | 2.26s | 300,080 B | `ccda470a9573789a...` |
| `m01_s10_e09_positions.txt` | Subject_10 | trial_09 | `optimal` | 259 | 2.59s | 340,929 B | `a00fb63a560a8367...` |
| `m01_s10_e10_positions_inc.txt` | Subject_10 | trial_10 | `non_optimal` | 220 | 2.2s | 292,392 B | `1f85d70a5138d0a0...` |
| `m01_s10_e10_positions.txt` | Subject_10 | trial_10 | `optimal` | 250 | 2.5s | 329,325 B | `2764277e5c604bac...` |
