# ASH VECTOR Update V179

## Training Object + Item Art Rename Pass

### Adds / Replaces
- Renamed the uploaded generated `unknown.png` files into clean game-ready paths.
- Adds 25 training object assets under `assets/training/objects/`.
- Adds 25 item/drop assets under `assets/training/items/`.
- Training nodes now draw their actual object art on the map instead of only the glyph box.
- Inventory, quick bag, victory loot, and item detail panels now show the matching art for training drops.
- Keeps old fallbacks, so missing assets will not break the game.

### Version
- Build bumped to v0.9.89.
- Cache bumped to ?v=179.

### Asset manifest

| Skill | Training object asset | Item/drop asset |
|---|---|---|
| cryptomining | `Ash Pebble Pile` → `assets/training/objects/cryptomining/ash_pebble_pile.png` | `Ash Pebble` → `assets/training/items/cryptomining/ash_pebble.png` |
| cryptomining | `Ash Ore Vein` → `assets/training/objects/cryptomining/ash_ore_vein.png` | `Ash Ore` → `assets/training/items/cryptomining/ash_ore.png` |
| cryptomining | `Dense Ash Vein` → `assets/training/objects/cryptomining/dense_ash_vein.png` | `Dense Ash Ore` → `assets/training/items/cryptomining/dense_ash_ore.png` |
| cryptomining | `Vector Crystal Seam` → `assets/training/objects/cryptomining/vector_crystal_seam.png` | `Vector Crystal` → `assets/training/items/cryptomining/vector_crystal.png` |
| cryptomining | `Obsidian Core Deposit` → `assets/training/objects/cryptomining/obsidian_core_deposit.png` | `Obsidian Core Ore` → `assets/training/items/cryptomining/obsidian_core_ore.png` |
| datafishing | `Static Packet Stream` → `assets/training/objects/datafishing/static_packet_stream.png` | `Static Packet` → `assets/training/items/datafishing/static_packet.png` |
| datafishing | `Encrypted Data Stream` → `assets/training/objects/datafishing/encrypted_data_stream.png` | `Encrypted Data` → `assets/training/items/datafishing/encrypted_data.png` |
| datafishing | `Ghost Log Pool` → `assets/training/objects/datafishing/ghost_log_pool.png` | `Ghost Log` → `assets/training/items/datafishing/ghost_log.png` |
| datafishing | `Blackbox Signal` → `assets/training/objects/datafishing/blackbox_signal.png` | `Blackbox File` → `assets/training/items/datafishing/blackbox_file.png` |
| datafishing | `Deep Archive Current` → `assets/training/objects/datafishing/deep_archive_current.png` | `Deep Archive Packet` → `assets/training/items/datafishing/deep_archive_packet.png` |
| codecraft | `Wire Scrap Bench` → `assets/training/objects/codecraft/wire_scrap_bench.png` | `Wire Scrap` → `assets/training/items/codecraft/wire_scrap.png` |
| codecraft | `Circuit Scrap Bench` → `assets/training/objects/codecraft/circuit_scrap_bench.png` | `Circuit Scrap` → `assets/training/items/codecraft/circuit_scrap.png` |
| codecraft | `Logic Board Station` → `assets/training/objects/codecraft/logic_board_station.png` | `Logic Board` → `assets/training/items/codecraft/logic_board.png` |
| codecraft | `Quantum Relay Rack` → `assets/training/objects/codecraft/quantum_relay_rack.png` | `Quantum Relay` → `assets/training/items/codecraft/quantum_relay.png` |
| codecraft | `Null Module Forge` → `assets/training/objects/codecraft/null_module_forge.png` | `Null Module Part` → `assets/training/items/codecraft/null_module_part.png` |
| forgenetics | `Spore Sample Pod` → `assets/training/objects/forgenetics/spore_sample_pod.png` | `Spore Sample` → `assets/training/items/forgenetics/spore_sample.png` |
| forgenetics | `Mutagen Sample Pod` → `assets/training/objects/forgenetics/mutagen_sample_pod.png` | `Mutagen Sample` → `assets/training/items/forgenetics/mutagen_sample.png` |
| forgenetics | `Mutated Tissue Bloom` → `assets/training/objects/forgenetics/mutated_tissue_bloom.png` | `Mutated Tissue` → `assets/training/items/forgenetics/mutated_tissue.png` |
| forgenetics | `Vector DNA Bloom` → `assets/training/objects/forgenetics/vector_dna_bloom.png` | `Vector DNA` → `assets/training/items/forgenetics/vector_dna.png` |
| forgenetics | `Ash Genome Vat` → `assets/training/objects/forgenetics/ash_genome_vat.png` | `Ash Genome Strand` → `assets/training/items/forgenetics/ash_genome_strand.png` |
| system_hacking | `Broken Token Relay` → `assets/training/objects/system_hacking/broken_token_relay.png` | `Broken Token` → `assets/training/items/system_hacking/broken_token.png` |
| system_hacking | `Access Fragment Relay` → `assets/training/objects/system_hacking/access_fragment_relay.png` | `Access Fragment` → `assets/training/items/system_hacking/access_fragment.png` |
| system_hacking | `Security Keybit Panel` → `assets/training/objects/system_hacking/security_keybit_panel.png` | `Security Keybit` → `assets/training/items/system_hacking/security_keybit.png` |
| system_hacking | `Root Cipher Console` → `assets/training/objects/system_hacking/root_cipher_console.png` | `Root Cipher` → `assets/training/items/system_hacking/root_cipher.png` |
| system_hacking | `Admin Ghost Terminal` → `assets/training/objects/system_hacking/admin_ghost_terminal.png` | `Admin Ghost Key` → `assets/training/items/system_hacking/admin_ghost_key.png` |

### Replace only
- index.html
- js/game.js
- assets/training/
- UPDATE_V179.md