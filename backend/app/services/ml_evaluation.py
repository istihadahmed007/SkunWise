import math
from typing import List, Dict, Any

class ModelEvaluator:
    """
    Independent Machine-Learning Evaluation Tooling for Medical Decision Support.
    Calculates clinical metrics:
    - Sensitivity (Recall)
    - Specificity
    - Precision (PPV)
    - False Negative Rate (Critical Safety KPI)
    - Brier Calibration Score
    - Disaggregated fairness metrics across Fitzpatrick Skin Phototypes
    """

    @staticmethod
    def calculate_binary_metrics(y_true: List[int], y_pred: List[int]) -> Dict[str, float]:
        """
        Calculates TP, FP, TN, FN, Sensitivity, Specificity, Precision, F1.
        """
        tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 1)
        fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 1)
        tn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 0)
        fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 0)

        sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        fnr = fn / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * sensitivity) / (precision + sensitivity) if (precision + sensitivity) > 0 else 0.0

        return {
            "true_positives": tp,
            "false_positives": fp,
            "true_negatives": tn,
            "false_negatives": fn,
            "sensitivity": round(sensitivity, 4),
            "specificity": round(specificity, 4),
            "precision": round(precision, 4),
            "false_negative_rate": round(fnr, 4),
            "f1_score": round(f1, 4)
        }

    @staticmethod
    def calculate_brier_calibration_score(y_true: List[int], y_prob: List[float]) -> float:
        """
        Brier Score = 1/N * sum((p_i - y_i)^2).
        Scores closer to 0 represent superior probabilistic calibration.
        """
        if not y_true or len(y_true) != len(y_prob):
            return 0.0
        squared_errors = [(p - y) ** 2 for y, p in zip(y_true, y_prob)]
        return round(sum(squared_errors) / len(squared_errors), 4)

    @classmethod
    def evaluate_cohort(cls, dataset: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Evaluates a complete validation cohort, with subgroup analysis
        across Fitzpatrick skin phototype tiers (Types I-II, III-IV, V-VI).
        """
        overall_true = [item["ground_truth_dysplasia"] for item in dataset]
        overall_pred = [item["predicted_dysplasia"] for item in dataset]
        overall_prob = [item["calibrated_prob"] for item in dataset]

        overall_metrics = cls.calculate_binary_metrics(overall_true, overall_pred)
        overall_brier = cls.calculate_brier_calibration_score(overall_true, overall_prob)
        overall_metrics["brier_score"] = overall_brier

        # Subgroup analysis by Fitzpatrick Phototype
        subgroups = {}
        for group_name in ["Types_I_II", "Types_III_IV", "Types_V_VI"]:
            sub = [item for item in dataset if item.get("fitzpatrick_group") == group_name]
            if sub:
                yt = [i["ground_truth_dysplasia"] for i in sub]
                yp = [i["predicted_dysplasia"] for i in sub]
                sub_metrics = cls.calculate_binary_metrics(yt, yp)
                subgroups[group_name] = sub_metrics

        return {
            "cohort_size": len(dataset),
            "overall_metrics": overall_metrics,
            "fitzpatrick_subgroup_analysis": subgroups
        }

