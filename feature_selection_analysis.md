# AIOT-DIC2 — Feature Selection Performance Curves Analysis

**Dataset**: `50_Startups.csv`  
**Target Variable**: `Profit` ($ USD)  
**Partitioning**: 80% Training ($n=40$), 20% Holdout Testing ($n=10$), `random_state=42`  
**Cross-Validation**: 5-Fold KFold, `shuffle=True`, `random_state=42` on Training Set  
**Model Family**: Multiple Linear Regression (`LinearRegression`)  

---

## 1. Executive Summary & Core Findings

本實驗對五種特徵選擇演算法（LassoCV、RFECV、Sequential Forward Selection、ElasticNetCV、Exhaustive Feature Selection）在特徵數 $k \in \{1, 2, 3, 4, 5\}$ 下的模型泛化效能進行全面實測。

### 核心結論：
1. **最佳特徵子集數為 $k=3$（全方法一致達成共識）**：
   - 五種方法在 $k=3$ 時均選出相同的三個特徵：`['R&D Spend', 'Marketing Spend', 'Administration']`。
   - 達到了 5-Fold Training CV RMSE 的**全局最低點（$9,583.68）**，顯著優於使用全部 5 個特徵的 Baseline（$9,991.81$），誤差下降了 **$408.13**。
2. **特徵增加的反效果（$k=4$ 與 $k=5$ 的效能退化）**：
   - 當 $k$ 從 3 增加至 4 與 5 時，引入了地理虛擬變數（`State_New York` 與 `State_Florida`）。
   - CV RMSE 不降反升：$k=3$ ($9,583.68$) $\rightarrow$ $k=4$ ($9,772.41$) $\rightarrow$ $k=5$ ($9,991.81$)。
   - 證明**增加特徵並不一定能帶來更好的預測能力**，無關雜訊特徵會消耗自由度並放大估計變異數。
3. **單一特徵的主導性（$k=1$）**：
   - 僅使用 `R&D Spend` 單一特徵時，模型即達到 $0.9384$ 的 CV $R^2$ 與 $7,714.33$ 的 Test RMSE，說明研發支出是獲利的最主要核心推動因子。

---

## 2. Experimental Data Summary (25 Model Evaluations)

以下為 5 種演算法在 $k=1 \sim 5$ 產生的 25 筆完整實測數據（源自 `feature_count_comparison.csv`）：

| Algorithm | $k$ | Selected Features | Train CV RMSE ($) | Train CV $R^2$ | Test MAE ($) | Test RMSE ($) | Test $R^2$ |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **LassoCV** | 1 | `['R&D Spend']` | 9,943.87 | 0.9384 | 6,077.36 | 7,714.33 | 0.9265 |
| **LassoCV** | 2 | `['R&D Spend', 'Marketing Spend']` | 9,682.56 | 0.9416 | 6,469.18 | 8,206.33 | 0.9168 |
| **LassoCV** | **3** | `['R&D Spend', 'Marketing Spend', 'Administration']` | **9,583.68** | **0.9399** | **6,979.15** | **8,995.91** | **0.9001** |
| **LassoCV** | 4 | `['R&D Spend', 'Marketing Spend', 'Administration', 'State_New York']` | 9,772.41 | 0.9377 | 6,974.87 | 9,015.11 | 0.8996 |
| **LassoCV** | 5 | `[All 5 Features]` | 9,991.81 | 0.9340 | 6,961.48 | 9,055.96 | 0.8987 |
| **RFECV** | 1 | `['R&D Spend']` | 9,943.87 | 0.9384 | 6,077.36 | 7,714.33 | 0.9265 |
| **RFECV** | 2 | `['R&D Spend', 'Marketing Spend']` | 9,682.56 | 0.9416 | 6,469.18 | 8,206.33 | 0.9168 |
| **RFECV** | **3** | `['R&D Spend', 'Marketing Spend', 'Administration']` | **9,583.68** | **0.9399** | **6,979.15** | **8,995.91** | **0.9001** |
| **RFECV** | 4 | `['R&D Spend', 'Marketing Spend', 'Administration', 'State_Florida']` | 9,786.25 | 0.9377 | 6,961.49 | 9,055.96 | 0.8987 |
| **RFECV** | 5 | `[All 5 Features]` | 9,991.81 | 0.9340 | 6,961.48 | 9,055.96 | 0.8987 |
| **SFS** | 1 | `['R&D Spend']` | 9,943.87 | 0.9384 | 6,077.36 | 7,714.33 | 0.9265 |
| **SFS** | 2 | `['R&D Spend', 'Marketing Spend']` | 9,682.56 | 0.9416 | 6,469.18 | 8,206.33 | 0.9168 |
| **SFS** | **3** | `['R&D Spend', 'Administration', 'Marketing Spend']` | **9,583.68** | **0.9399** | **6,979.15** | **8,995.91** | **0.9001** |
| **SFS** | 4 | `['State_New York', 'R&D Spend', 'Administration', 'Marketing Spend']` | 9,772.41 | 0.9377 | 6,974.87 | 9,015.11 | 0.8996 |
| **SFS** | 5 | `[All 5 Features]` | 9,991.81 | 0.9340 | 6,961.48 | 9,055.96 | 0.8987 |
| **ElasticNetCV** | 1 | `['R&D Spend']` | 9,943.87 | 0.9384 | 6,077.36 | 7,714.33 | 0.9265 |
| **ElasticNetCV** | 2 | `['R&D Spend', 'Marketing Spend']` | 9,682.56 | 0.9416 | 6,469.18 | 8,206.33 | 0.9168 |
| **ElasticNetCV** | **3** | `['R&D Spend', 'Marketing Spend', 'Administration']` | **9,583.68** | **0.9399** | **6,979.15** | **8,995.91** | **0.9001** |
| **ElasticNetCV** | 4 | `['R&D Spend', 'Marketing Spend', 'Administration', 'State_New York']` | 9,772.41 | 0.9377 | 6,974.87 | 9,015.11 | 0.8996 |
| **ElasticNetCV** | 5 | `[All 5 Features]` | 9,991.81 | 0.9340 | 6,961.48 | 9,055.96 | 0.8987 |
| **Exhaustive** | 1 | `['R&D Spend']` | 9,943.87 | 0.9384 | 6,077.36 | 7,714.33 | 0.9265 |
| **Exhaustive** | 2 | `['R&D Spend', 'Marketing Spend']` | 9,682.56 | 0.9416 | 6,469.18 | 8,206.33 | 0.9168 |
| **Exhaustive** | **3** | `['R&D Spend', 'Administration', 'Marketing Spend']` | **9,583.68** | **0.9399** | **6,979.15** | **8,995.91** | **0.9001** |
| **Exhaustive** | 4 | `['State_New York', 'R&D Spend', 'Administration', 'Marketing Spend']` | 9,772.41 | 0.9377 | 6,974.87 | 9,015.11 | 0.8996 |
| **Exhaustive** | 5 | `[All 5 Features]` | 9,991.81 | 0.9340 | 6,961.48 | 9,055.96 | 0.8987 |

---

## 3. Algorithm-Specific Analysis & Ranking Logic

### 1. LassoCV (L1 Regularization Ranking)
- **原理**：透過在特徵標準化後加入 L1 正則化懲罰項，非關鍵係數會被壓縮為 0。依照標準化回歸係數絕對值 $|\beta_{\text{std}}|$ 由大到小排序得到特徵重要性序列。
- **排序結果**：
  1. `R&D Spend` ($|\beta| \approx 36,751$)
  2. `Marketing Spend` ($|\beta| \approx 3,745$)
  3. `Administration` ($|\beta| \approx 1,822$)
  4. `State_New York` ($|\beta| \approx 3.2$)
  5. `State_Florida` ($|\beta| \approx 0.0$)
- **表現**：在 $k=3$ 時達成全域最佳解，精準過濾掉兩組州別虛擬變數。

### 2. ElasticNetCV (L1 + L2 Hybrid Ranking)
- **原理**：結合 L1（Sparsity）與 L2（Ridge Shrinkage）雙重懲罰，能穩定處理具備共線性的特徵。
- **排序結果**：與 LassoCV 完全一致。
- **表現**：因本資料集特徵維度小 ($p=5$)，ElasticNet 在最佳 $\alpha$ 與 `l1_ratio=1.0` 處收斂，行為等同 LassoCV。

### 3. RFECV (Recursive Feature Elimination Ranking)
- **重要實驗定義說明**：
  - **既有模型行為**：原始未標準化之 `RFECV(LinearRegression())` 依據未標準化原始係數消除。由於 `State_Florida` 為 0/1 虛擬變數，其未標準化係數高達 $\approx 938.8$，而數十萬美元尺度的 `Marketing Spend` 未標準化係數僅為 $0.0298$。未標準化 RFE 優先消除了具備極高預測價值的 `Marketing Spend`，導致誤差驟升，因而 RFECV 停止消除並保留全部 5 個特徵。
  - **Top-k 曲線定義**：為產出合理的 $k=1 \sim 5$ 遞迴消除排序曲線，本次實驗依據標準化尺度執行 RFE，其消除順序為：
    1. 消除 `State_New York` (Rank 5)
    2. 消除 `State_Florida` (Rank 4)
    3. 消除 `Administration` (Rank 3)
    4. 消除 `Marketing Spend` (Rank 2)
    5. 最後保留 `R&D Spend` (Rank 1)
  - **表現**：在標準化排名下，RFECV 在 $k=1, 2, 3$ 的表現與其他方法完全重合，並在 $k=3$ 達到最低 CV RMSE。

### 4. Sequential Forward Selection (SFS)
- **原理**：貪婪前向選擇（Greedy Forward Selection）。從空集合出發，在每一步遍歷所有剩餘候選特徵，挑選使 5-Fold CV RMSE 最小化的特徵加入。
- **遞進歷程**：
  - Step 1: 加入 `R&D Spend` (CV RMSE: 9,943.87)
  - Step 2: 加入 `Marketing Spend` (CV RMSE: 9,682.56)
  - Step 3: 加入 `Administration` (CV RMSE: 9,583.68) $\leftarrow$ **達到全域極小值**
  - Step 4: 加入 `State_New York` (CV RMSE: 9,772.41)
  - Step 5: 加入全部特徵 (CV RMSE: 9,991.81)

### 5. Exhaustive Feature Selection (Global Combinatorial Search)
- **原理**：枚舉每個 $k$ 的所有可能組合（$k=1: 5$, $k=2: 10$, $k=3: 10$, $k=4: 5$, $k=5: 1$，共 31 種子集），以 5-Fold CV 尋找真實全域最佳組合。
- **結論**：SFS 的貪婪路徑與 Exhaustive 的全域窮舉路徑在每一個 $k$ 都完全一致，證實本資料集的特徵搜尋空間不存在局部極小值（Local Minima）陷阱。

---

## 4. Why Adding More Features Is Not Always Better

在傳統直覺中，加入更多自變數似乎能「提供更多資訊」。然而機器學習與統計理論指出，**無節制增加特徵往往會導致模型退化**。本實驗具體體現了以下三項關鍵機制：

### 1. 雜訊特徵與模型方差增加（Noise & Variance Inflation）
- `State_Florida` 與 `State_New York` 與 Profit 的相關係數分別為 $-0.017$ 與 $+0.031$，均未達統計顯著水準。
- 當模型強行估計這些虛擬變數的權重時，實際上是在擬合訓練集特有的抽樣隨機誤差（Random Fluctuations），導致模型的估計方差（Variance）上升。

### 2. 自由度損失（Loss of Degrees of Freedom）
- 訓練樣本數僅有 $N=40$。當特徵數從 $k=3$ 擴展至 $k=5$ 時，模型估計的參數增加 66%（從 4 個參數增加到 6 個參數）。
- 在小樣本環境下，過多無效參數會直接削弱估計量的穩定性，導致在交叉驗證未知 Fold 上的預測泛化能力大幅衰退。

### 3. 多重共線性（Multicollinearity）
- 即使採用了 `drop='first'` 避免虛擬變數陷阱，地理分佈在整體樣本中分佈均衡（17:17:16），與研發、行銷等主導業務指標幾無相關。將其納入多元回歸只會分散梯度並增加模型的不確定性。

---

## 5. Overfitting & Generalization Analysis

比較 5-Fold Training CV 指標與獨立 Holdout Test Set 指標可獲得重要的驗證洞見：

```
CV RMSE Curve:
k=1 (9,943.87) ──> k=2 (9,682.56) ──> k=3 (9,583.68, Optimal) ──> k=4 (9,772.41) ──> k=5 (9,991.81)
                                      ▲ 最低交叉驗證誤差
```

- **測試集（Test Set）的特殊現象**：
  - 在獨立的 10 筆 Test Set 上，$k=1$ 的 Test RMSE 為 $7,714.33$，反而低於 $k=3$ 的 $8,995.91$。
  - **嚴正遵循方法學**：**絕對不得依據 Test Set 指標回頭選擇模型**！Test Set 僅有 10 筆樣本，極易受到單一極端值或抽樣分佈偏差影響（Sample Fluctuation）。
  - 若以 Test Set 挑選 $k=1$，本質上等同於對測試集過度擬合（Information Leakage / P-hacking）。
  - 5-Fold CV 聚合了 40 筆樣本的平均泛化能力，其指示的 $k=3$ 才是統計上最穩健、真正具備泛化能力的最佳模型。

---

## 6. Data Leakage & Methodological Rigor

本實驗嚴格遵循無資料洩漏（No Data Leakage）設計準則：

1. **嚴格隔離測試集**：
   - 所有的特徵選擇流程（Lasso 權重、RFE 遞迴、SFS 步驟、Exhaustive 枚舉）**僅在 Training Set ($n=40$) 上執行**。
   - 測試集 ($n=10$) 僅在特徵子集完全選定並訓練最終 OLS 模型後，進行一次性衡量。
2. **模型選擇 CV vs. 巢狀外層 CV 的樂觀偏差說明**：
   - **本實驗之選模 CV 曲線**：利用 5-Fold CV 比較不同子集的效能以決定最佳 $k$。這種做法是業界標準的模型選擇（Model Selection）手法。
   - **潛在樂觀偏差（Optimistic Bias）**：因為特徵子集是在完整的 40 筆 Training Data 上選出後再計算 CV 分數，理論上該 CV 分數存在輕微的選模樂觀偏差。
   - **真正無偏差評估**：最終以固定獨立的 Holdout Test Set 作為檢驗基準，證實 $k=3$ 模型在測試集上依然展現高達 **$0.9001$** 的穩健 $R^2$ 判定係數。

---

## 7. Artifact Links & Deliverables

- 數據明細表格：[feature_count_comparison.csv](feature_count_comparison.csv)
- RMSE 效能比較圖表：[rmse_vs_feature_count.png](rmse_vs_feature_count.png)
- R² 效能比較圖表：[r2_vs_feature_count.png](r2_vs_feature_count.png)
- 既有基準模型對照表（維持不變）：[model_comparison.csv](model_comparison.csv)
- Dashboard 曲線數據源：[dashboard/public/data/feature_count_data.json](dashboard/public/data/feature_count_data.json)
