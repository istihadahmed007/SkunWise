from app.services.ml_evaluation import ModelEvaluator

def test_ml_evaluation_metrics_and_calibration():
    # Synthetic validation cohort representing ISIC / clinical test samples
    validation_cohort = [
        {"id": "S1", "fitzpatrick_group": "Types_I_II", "ground_truth_dysplasia": 1, "predicted_dysplasia": 1, "calibrated_prob": 0.88},
        {"id": "S2", "fitzpatrick_group": "Types_I_II", "ground_truth_dysplasia": 0, "predicted_dysplasia": 0, "calibrated_prob": 0.12},
        {"id": "S3", "fitzpatrick_group": "Types_III_IV", "ground_truth_dysplasia": 1, "predicted_dysplasia": 1, "calibrated_prob": 0.82},
        {"id": "S4", "fitzpatrick_group": "Types_III_IV", "ground_truth_dysplasia": 0, "predicted_dysplasia": 0, "calibrated_prob": 0.18},
        {"id": "S5", "fitzpatrick_group": "Types_V_VI", "ground_truth_dysplasia": 1, "predicted_dysplasia": 1, "calibrated_prob": 0.79},
        {"id": "S6", "fitzpatrick_group": "Types_V_VI", "ground_truth_dysplasia": 0, "predicted_dysplasia": 0, "calibrated_prob": 0.15},
        {"id": "S7", "fitzpatrick_group": "Types_V_VI", "ground_truth_dysplasia": 0, "predicted_dysplasia": 1, "calibrated_prob": 0.55}, # False positive
    ]

    results = ModelEvaluator.evaluate_cohort(validation_cohort)
    
    assert results["cohort_size"] == 7
    overall = results["overall_metrics"]
    
    # Sensitivity should be 100% (all 3 ground truth dysplasias detected)
    assert overall["sensitivity"] == 1.0
    assert overall["false_negative_rate"] == 0.0  # 0 missed cancers
    assert overall["specificity"] > 0.70
    assert overall["brier_score"] < 0.15  # Well-calibrated
    
    # Subgroup analysis exists across all Fitzpatrick groups
    subgroups = results["fitzpatrick_subgroup_analysis"]
    assert "Types_I_II" in subgroups
    assert "Types_III_IV" in subgroups
    assert "Types_V_VI" in subgroups
    assert subgroups["Types_V_VI"]["sensitivity"] == 1.0

