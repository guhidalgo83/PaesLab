from pathlib import Path
import json,re
from collections import Counter,defaultdict

root=Path(__file__).resolve().parents[1]
deep=json.load(open(root/"content_specs/deep_content_8b_v275.json",encoding="utf-8"))
curr=json.load(open(root/"content_specs/curriculum_master_8b_v275.json",encoding="utf-8"))
keys=json.load(open(root/"content_specs/guided_answer_keys_8b_v275.json",encoding="utf-8"))
coverage=json.load(open(root/"content_specs/curriculum_coverage_8b_v275.json",encoding="utf-8"))
items=json.load(open(root/"content_specs/assessment_items_8b_v276.json",encoding="utf-8"))
sets=json.load(open(root/"content_specs/review_sets_8b_v276.json",encoding="utf-8"))
meta=json.load(open(root/"content_specs/adaptive_metadata_8b_v277.json",encoding="utf-8"))
diag=json.load(open(root/"content_specs/diagnostic_blueprint_8b_v278.json",encoding="utf-8"))
routes=json.load(open(root/"content_specs/learning_routes_8b_v279.json",encoding="utf-8"))
certs=json.load(open(root/"content_specs/assessment_certification_8b_v279.json",encoding="utf-8"))
source=json.load(open(root/"content_specs/curriculum_source_snapshot_8b_v279.json",encoding="utf-8"))

topics=deep["topics"]
assert deep["course_id"]=="cl-8-basico"
assert curr["course_id"]=="cl-8-basico"
assert len(curr["oas"])==17
assert [o["code"] for o in curr["oas"]]==[f"MA08 OA {i:02d}" for i in range(1,18)]

# Deep staging.
assert len(topics)==34 and len({t["topic_id"] for t in topics})==34
assert all(t["topic_id"].startswith("topic-v275-ma08-") for t in topics)
assert all(t["status"]=="staging" and t["quality_score"]==0 for t in topics)
assert all(t["source_notes"]["v275"]["snapshot_date"]=="2026-08-11" for t in topics)
assert all(t["source_notes"]["v275"]["curriculum_revalidation_before_release"] is True for t in topics)
assert sum(len(t["micro_lessons"]) for t in topics)==204
assert sum(len(t["worked_examples"]) for t in topics)==204
assert sum(len(t["guided_practice"]) for t in topics)==272
assert sum(len(t["representations"]) for t in topics)==102
assert sum(len(t["interactive_specs"]) for t in topics)==34
assert len(keys)==272
worked=[e["problem"] for t in topics for e in t["worked_examples"]]
guided=[e["problem"] for t in topics for e in t["guided_practice"]]
assert len(worked)==len(set(worked))==204
assert len(guided)==len(set(guided))==272
assert all(len(t["micro_lessons"])==6 and len(t["worked_examples"])==6 and len(t["guided_practice"])==8
           and len(t["representations"])==3 and len(t["interactive_specs"])==1 for t in topics)

topic_ids={t["topic_id"] for t in topics}
assert len({k["item_id"] for k in keys})==272
assert all(k["topic_id"] in topic_ids for k in keys)

# Exact real DB ordinal constraint: 8 ordinals per OA.
assert len(curr["nodes"])==136 and len(coverage)==136
node_ids={n["node_id"] for n in curr["nodes"]}
assert len(node_ids)==136
triples=[(n["course_id"],n["oa_code"],n["ordinal"]) for n in curr["nodes"]]
assert len(triples)==len(set(triples))==136
byoa=defaultdict(list); byoat=defaultdict(set)
for n in curr["nodes"]:
    byoa[n["oa_code"]].append(n["ordinal"])
    byoat[n["oa_code"]].add(n["topic_id"])
assert len(byoa)==17
assert all(sorted(v)==list(range(1,9)) for v in byoa.values())
assert all(len(v)==2 for v in byoat.values())
assert all(c["node_id"] in node_ids and c["topic_id"] in topic_ids for c in coverage)
assert all(c["auto_state"]=="strong" and c["human_review_status"]=="pending" for c in coverage)

# Assessment 34 × 26.
assert len(items)==884
assert sum(x["kind"]=="practice" for x in items)==680
assert sum(x["kind"]=="diagnostic" for x in items)==102
assert sum(x["kind"]=="review" for x in items)==102
assert len({x["item_id"] for x in items})==884
assert len({x["stem"] for x in items})==884
assert all(x["course_id"]=="cl-8-basico" and x["topic_id"] in topic_ids and x["curriculum_node_id"] in node_ids for x in items)
assert all(x["status"]=="staging" and x["is_published"] is False for x in items)

def norm(s):
    s=str(s).strip().lower().replace(" ","").replace(",",".").replace("°","deg")
    try:return ("num",round(float(s),10))
    except:return ("txt",s)

assert all(len(x["options"])==4 for x in items)
assert all(len({norm(o["text"]) for o in x["options"]})==4 for x in items)
assert Counter(x["correct_option"] for x in items)==Counter({"A":221,"B":221,"C":221,"D":221})
assert not any("Alternativa conceptual" in str(o["text"]) for x in items for o in x["options"])
assert not any(re.match(r"(?i)^(caso|variante)\b",x["stem"]) for x in items)

bytopic=defaultdict(list)
for x in items: bytopic[x["topic_id"]].append(x)
assert len(bytopic)==34
for xs in bytopic.values():
    assert len(xs)==26
    assert sum(x["kind"]=="practice" for x in xs)==20
    assert sum(x["kind"]=="diagnostic" for x in xs)==3
    assert sum(x["kind"]=="review" for x in xs)==3
    assert len({x["curriculum_node_id"] for x in xs})==4

# Review sets exactly cover review bank once.
assert len(sets)==4
members=[i for s in sets for i in s["item_ids"]]
reviewids={x["item_id"] for x in items if x["kind"]=="review"}
assert len(members)==102 and len(set(members))==102 and set(members)==reviewids
assert all(s["status"]=="staging" and s["is_published"] is False for s in sets)

# Adaptive: explicitly heuristic, never fake calibration.
assert len(meta)==884
assert {m["item_id"] for m in meta}=={x["item_id"] for x in items}
assert all(m["calibration_status"]=="heuristic_candidate" for m in meta)
assert all(m["metadata_origin"]=="rule_based_v277" for m in meta)
assert min(m["evidence_weight"] for m in meta)==0.92
assert max(m["evidence_weight"] for m in meta)==1.14

# Diagnostic/route/cert gates.
assert len(diag["candidate_item_ids"])==102
assert diag["min_items"]==34 and diag["target_items"]==34 and diag["max_items"]==40
di=[x for x in items if x["kind"]=="diagnostic"]
assert len({x["topic_id"] for x in di})==34
assert set(diag["candidate_item_ids"])=={x["item_id"] for x in di}
assert len(routes)==34 and {r["topic_id"] for r in routes}==topic_ids
assert len(certs)==34 and {c["topic_id"] for c in certs}==topic_ids
assert all(c["certified"] is False for c in certs)
assert all(c[k]=="pending" for c in certs for k in ["mathematical_status","curriculum_status","editorial_status","distractor_status","adaptive_status"])

# Curriculum governance.
assert source["snapshot_date"]=="2026-08-11"
assert source["requires_revalidation_before_release"] is True
assert source["update_process_status"]=="monitoring"
assert source["official_oa_count"]==17 and source["topic_count"]==34

sql=(root/"supabase/135_mathlabs_v275_v279_8b_macroblock_full_install.sql").read_text(encoding="utf-8")
low=sql.lower()
for marker in [
 "recompute_deep_content_quality_v275_8b",
 "refresh_v269_course_assessment_readiness",
 "preview_v267_adaptive_items",
 "preview_v268_diagnostic",
 "review_v269_assessment_topic",
 "assert_v269_course_release_ready",
 "get_v279_8b_expansion_overview",
 "curriculum_revalidation_required_before_release",
 "adaptive_calibration_pending",
 "live_student_delivery_disabled",
 "heuristic_candidate","rule_based_v277",
 "baseline 1m v27.0-v27.4 alterado",
 "expected_oa_count=17","expected_topic_count=34",
 "min_allowed:=34; max_allowed:=40",
 "cl-8-basico','cl-1-medio','cl-2-medio"
]:
    assert marker in low,marker

assert "school_review_items where course_id" not in low
assert "set status='published'" not in low
assert "grant execute" in low
assert " to anon;" not in low
assert "no repitas sql 135" in low
assert "v270_v274" not in low
assert sql.count("$$")%2==0
for tag in ["sources","oas","axes","objectives","knowledge","knowledge2","paths","keys","nodes",
            "coverage","items","sets","meta","diag","stop","outputs","routes"]:
    assert sql.count(f"${tag}$")==2,(tag,sql.count(f"${tag}$"))

def embedded(tag):
    a=sql.index(f"${tag}$")+len(f"${tag}$")
    b=sql.index(f"${tag}$::jsonb",a)
    return json.loads(sql[a:b])

assert embedded("paths")==topics
assert embedded("keys")==keys
assert embedded("nodes")==curr["nodes"]
assert embedded("coverage")==coverage
assert embedded("items")==items
assert embedded("meta")==meta
assert embedded("diag")==diag["candidate_item_ids"]
assert embedded("stop")==diag["stopping_rules"]
assert embedded("outputs")==diag["profile_outputs"]
assert embedded("routes")==routes

verify=(root/"supabase/136_verify_mathlabs_v275_v279_8b_macroblock.sql").read_text(encoding="utf-8").lower()
for m in ["official_oas","assessment_items","heuristic_metadata","curriculum_revalidation_required",
          "ordinal_collision_groups","oa_with_bad_ordinal_span","v274_1m_assessment_items",
          "v269_2m_assessment_items","v264_3m_assessment_items","v24_release_aplicado","published_sets"]:
    assert m in verify,m

print("MathLabs V27.5–V27.9 · 8B MACROBLOCK gate OK")
print("17 OA · 34 topics · 136 nodos · 204 micro · 204 worked · 272 guided · 102 reps · 34 labs")
print("884 ítems = 680 Practice + 102 Diagnostic + 102 Review · 4 Review Sets")
print("A/B/C/D = 221/221/221/221 · 884 stems únicos · 0 opciones semánticamente duplicadas")
print("884 metadata heuristic_candidate · 0 calibrada · evidence weight 0.92–1.14")
print("Diagnóstico 34/34 topics · min/target/max 34/34/40")
print("DB ordinal gate 136/136 · 17 OA con ordinales exactos 1..8")
print("Curriculum snapshot 2026-08-11 · revalidation before release REQUIRED")
print("0 published · 0 release candidates · live student delivery OFF")
