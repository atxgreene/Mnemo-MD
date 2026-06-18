/**
 * One-tap starter courses for common medical-school subjects and boards.
 * Applying a template fills in topics (and fills empty profile fields),
 * removing the blank-slate friction of setting up from scratch.
 */
export interface CourseTemplate {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  examName: string;
  difficulty: string;
  topics: string[];
}

// Difficulty strings match the options in the Course Profile dropdown.
const STD = "Standard exam level";
const HARD = "Challenging — integration & application";
const BOARD = "Board / USMLE-style reasoning";

export const TEMPLATES: CourseTemplate[] = [
  {
    id: "anatomy",
    name: "Human Anatomy",
    emoji: "🦴",
    blurb: "Gross anatomy, systems, and structures.",
    examName: "Anatomy Exam",
    difficulty: STD,
    topics: [
      "skeletal system", "muscular system", "nervous system", "cardiovascular system",
      "respiratory system", "digestive system", "upper limb", "lower limb",
      "thorax", "abdomen", "head & neck", "cranial nerves",
    ],
  },
  {
    id: "physiology",
    name: "Physiology",
    emoji: "🫀",
    blurb: "How body systems function and regulate.",
    examName: "Physiology Exam",
    difficulty: HARD,
    topics: [
      "membrane transport", "action potentials", "cardiac cycle", "blood pressure regulation",
      "respiratory mechanics", "gas exchange", "renal filtration", "acid-base balance",
      "endocrine signaling", "GI motility & secretion", "neuromuscular junction", "thermoregulation",
    ],
  },
  {
    id: "biochem",
    name: "Biochemistry",
    emoji: "🧪",
    blurb: "Metabolism, enzymes, and molecular biology.",
    examName: "Biochemistry Exam",
    difficulty: HARD,
    topics: [
      "amino acids & proteins", "enzyme kinetics", "glycolysis", "citric acid cycle",
      "oxidative phosphorylation", "gluconeogenesis", "lipid metabolism", "urea cycle",
      "DNA replication", "transcription", "translation", "vitamins & cofactors",
    ],
  },
  {
    id: "pharm",
    name: "Pharmacology",
    emoji: "💊",
    blurb: "Drug mechanisms, classes, and effects.",
    examName: "Pharmacology Exam",
    difficulty: BOARD,
    topics: [
      "pharmacokinetics", "pharmacodynamics", "autonomic drugs", "cardiovascular drugs",
      "antibiotics", "antivirals", "CNS drugs", "analgesics & NSAIDs",
      "endocrine drugs", "chemotherapy agents", "drug interactions", "toxicology & antidotes",
    ],
  },
  {
    id: "micro",
    name: "Microbiology",
    emoji: "🦠",
    blurb: "Bacteria, viruses, fungi, and parasites.",
    examName: "Microbiology Exam",
    difficulty: STD,
    topics: [
      "bacterial structure", "gram-positive bacteria", "gram-negative bacteria", "virology basics",
      "DNA viruses", "RNA viruses", "mycology", "parasitology",
      "antimicrobial mechanisms", "antibiotic resistance", "immunization", "sterilization & disinfection",
    ],
  },
  {
    id: "immuno",
    name: "Immunology",
    emoji: "🛡️",
    blurb: "Innate & adaptive immunity.",
    examName: "Immunology Exam",
    difficulty: HARD,
    topics: [
      "innate immunity", "adaptive immunity", "B cells & antibodies", "T cell activation",
      "MHC & antigen presentation", "complement system", "cytokines", "hypersensitivity reactions",
      "immunodeficiencies", "autoimmunity", "vaccines", "transplant immunology",
    ],
  },
  {
    id: "path",
    name: "Pathology",
    emoji: "🔬",
    blurb: "Disease mechanisms and morphology.",
    examName: "Pathology Exam",
    difficulty: BOARD,
    topics: [
      "cell injury & death", "inflammation", "tissue repair", "hemodynamics & edema",
      "thrombosis & embolism", "neoplasia", "genetic disorders", "immunopathology",
      "cardiovascular pathology", "respiratory pathology", "GI & liver pathology", "renal pathology",
    ],
  },
  {
    id: "genetics",
    name: "Genetics",
    emoji: "🧬",
    blurb: "Inheritance and molecular genetics.",
    examName: "Genetics Exam",
    difficulty: STD,
    topics: [
      "Mendelian inheritance", "pedigree analysis", "linkage & recombination", "mutations",
      "chromosomal disorders", "population genetics", "Hardy-Weinberg", "gene expression regulation",
      "epigenetics", "cancer genetics", "genetic testing", "imprinting",
    ],
  },
  {
    id: "histology",
    name: "Histology",
    emoji: "🔬",
    blurb: "Tissues and microscopic structure.",
    examName: "Histology Exam",
    difficulty: STD,
    topics: [
      "epithelium", "connective tissue", "muscle tissue", "nervous tissue",
      "blood & hematopoiesis", "cartilage & bone", "lymphoid organs", "skin & integument",
      "GI tract histology", "respiratory histology", "renal histology", "endocrine glands",
    ],
  },
  {
    id: "neuro",
    name: "Neuroanatomy & Neuro",
    emoji: "🧠",
    blurb: "CNS structure, tracts, and function.",
    examName: "Neuroscience Exam",
    difficulty: HARD,
    topics: [
      "neuron & synapse", "cerebral cortex", "basal ganglia", "cerebellum",
      "brainstem & cranial nerves", "spinal cord & tracts", "ascending/descending pathways", "limbic system",
      "ventricles & CSF", "blood supply & stroke syndromes", "neurotransmitter systems", "special senses",
    ],
  },
  {
    id: "biostats",
    name: "Biostatistics & Epi",
    emoji: "📊",
    blurb: "Stats and epidemiology for boards.",
    examName: "Biostatistics Exam",
    difficulty: STD,
    topics: [
      "study designs", "sensitivity & specificity", "PPV & NPV", "incidence & prevalence",
      "relative risk & odds ratio", "hypothesis testing & p-values", "confidence intervals", "bias & confounding",
      "screening", "survival analysis", "number needed to treat", "ethics & informed consent",
    ],
  },
  {
    id: "usmle-step1",
    name: "USMLE Step 1 (high-yield)",
    emoji: "🩺",
    blurb: "Integrated, organ-system high-yield.",
    examName: "USMLE Step 1",
    difficulty: BOARD,
    topics: [
      "cardiovascular", "respiratory", "renal", "gastrointestinal",
      "endocrine", "reproductive", "hematology & oncology", "musculoskeletal",
      "neurology & psychiatry", "immunology", "microbiology", "pharmacology & toxicology",
    ],
  },
];

