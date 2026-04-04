import fs from 'fs/promises'
import path from 'path'

import mysql from 'mysql2/promise'

const rootDir = process.cwd()
const dataDir = path.join(rootDir, 'data')

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function loadEnvFile(fileName) {
  const absolutePath = path.join(rootDir, fileName)

  try {
    const content = await fs.readFile(absolutePath, 'utf8')

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim()

      if (!line || line.startsWith('#')) {
        continue
      }

      const separatorIndex = line.indexOf('=')

      if (separatorIndex === -1) {
        continue
      }

      const key = line.slice(0, separatorIndex).trim()
      const rawValue = line.slice(separatorIndex + 1).trim()
      const value = rawValue.replace(/^"|"$/g, '').replace(/^'|'$/g, '')

      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    // Ignore missing env files.
  }
}

async function readJson(relativePath) {
  const absolutePath = path.join(dataDir, ...relativePath.split('/'))
  const raw = await fs.readFile(absolutePath, 'utf8')
  return JSON.parse(raw)
}

function ensureDbEnv() {
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing database env: ${missing.join(', ')}`)
  }
}

function buildPool() {
  ensureDbEnv()

  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 6,
  })
}

function arrayify(value) {
  return Array.isArray(value) ? value : []
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))]
}

function deriveMaterialSlug(entry, payload) {
  return slugify(entry.id || payload.id || `material-${path.parse(entry.file).name}`)
}

function deriveSetSlug(entry, payload, sourceKind) {
  return slugify(entry.id || payload.id || `${sourceKind}-${path.parse(entry.file).name}`)
}

function normalizeSubject({ category, level, name, description }) {
  const subjectName = String(name || category || level || 'General Subject').trim()
  const subjectLevel = level ? String(level).trim() : null
  return {
    category: String(category || 'GENERAL').trim(),
    level: subjectLevel,
    name: subjectName,
    slug: slugify(`${category}-${subjectName}`),
    description: description ? String(description).trim() : null,
  }
}

async function ensureSubject(connection, subject) {
  const [result] = await connection.execute(
    `INSERT INTO content_subjects (category, level_label, name, slug, description, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       id = LAST_INSERT_ID(id),
       category = VALUES(category),
       level_label = VALUES(level_label),
       name = VALUES(name),
       description = VALUES(description),
       metadata_json = VALUES(metadata_json),
       updated_at = CURRENT_TIMESTAMP`,
    [subject.category, subject.level, subject.name, subject.slug, subject.description, JSON.stringify(subject)],
  )

  return result.insertId
}

async function upsertMaterial(connection, material) {
  const [result] = await connection.execute(
    `INSERT INTO materials (subject_id, source_id, source_path, category, level_label, slug, title, summary, description, tags_json, section_count, item_count, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       id = LAST_INSERT_ID(id),
       subject_id = VALUES(subject_id),
       source_id = VALUES(source_id),
       category = VALUES(category),
       level_label = VALUES(level_label),
       slug = VALUES(slug),
       title = VALUES(title),
       summary = VALUES(summary),
       description = VALUES(description),
       tags_json = VALUES(tags_json),
       section_count = VALUES(section_count),
       item_count = VALUES(item_count),
       metadata_json = VALUES(metadata_json),
       updated_at = CURRENT_TIMESTAMP`,
    [
      material.subjectId,
      material.sourceId,
      material.sourcePath,
      material.category,
      material.level,
      material.slug,
      material.title,
      material.summary,
      material.description,
      JSON.stringify(material.tags),
      material.sectionCount,
      material.itemCount,
      JSON.stringify(material.metadata),
    ],
  )

  return result.insertId
}

async function replaceMaterialSections(connection, materialId, sections) {
  await connection.execute(`DELETE FROM material_sections WHERE material_id = ?`, [materialId])

  for (const section of sections) {
    await connection.execute(
      `INSERT INTO material_sections (material_id, section_order, title, body)
       VALUES (?, ?, ?, ?)`,
      [materialId, section.order, section.title, section.body],
    )
  }
}

async function upsertQuestionSet(connection, questionSet) {
  const [result] = await connection.execute(
    `INSERT INTO question_sets (subject_id, source_kind, source_id, source_path, category, level_label, slug, title, focus, mode, description, item_count, duration_minutes, tags_json, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       id = LAST_INSERT_ID(id),
       subject_id = VALUES(subject_id),
       source_kind = VALUES(source_kind),
       source_id = VALUES(source_id),
       category = VALUES(category),
       level_label = VALUES(level_label),
       slug = VALUES(slug),
       title = VALUES(title),
       focus = VALUES(focus),
       mode = VALUES(mode),
       description = VALUES(description),
       item_count = VALUES(item_count),
       duration_minutes = VALUES(duration_minutes),
       tags_json = VALUES(tags_json),
       metadata_json = VALUES(metadata_json),
       updated_at = CURRENT_TIMESTAMP`,
    [
      questionSet.subjectId,
      questionSet.sourceKind,
      questionSet.sourceId,
      questionSet.sourcePath,
      questionSet.category,
      questionSet.level,
      questionSet.slug,
      questionSet.title,
      questionSet.focus,
      questionSet.mode,
      questionSet.description,
      questionSet.itemCount,
      questionSet.durationMinutes,
      JSON.stringify(questionSet.tags),
      JSON.stringify(questionSet.metadata),
    ],
  )

  return result.insertId
}

async function ensureTag(connection, label) {
  const slug = slugify(label)
  const [result] = await connection.execute(
    `INSERT INTO question_tags (slug, label)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE
       id = LAST_INSERT_ID(id),
       label = VALUES(label),
       updated_at = CURRENT_TIMESTAMP`,
    [slug, label],
  )

  return result.insertId
}

async function replaceSetQuestions(connection, setId, questions) {
  await connection.execute(`DELETE FROM questions WHERE set_id = ?`, [setId])

  for (const question of questions) {
    const [questionResult] = await connection.execute(
      `INSERT INTO questions (set_id, source_question_id, question_order, question_text, answer_key, explanation, tip, topic, difficulty, level_label, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        setId,
        question.sourceQuestionId,
        question.order,
        question.text,
        question.answerKey,
        question.explanation,
        question.tip,
        question.topic,
        question.difficulty,
        question.level,
        JSON.stringify(question.metadata),
      ],
    )

    const questionId = questionResult.insertId

    for (const option of question.options) {
      await connection.execute(
        `INSERT INTO question_options (question_id, option_key, option_text, option_order)
         VALUES (?, ?, ?, ?)`,
        [questionId, option.key, option.text, option.order],
      )
    }

    for (const tagLabel of question.tags) {
      const tagId = await ensureTag(connection, tagLabel)
      await connection.execute(
        `INSERT IGNORE INTO question_tag_map (question_id, tag_id)
         VALUES (?, ?)`,
        [questionId, tagId],
      )
    }
  }
}

function normalizeMaterialEntry(entry, payload) {
  const title = String(payload.title || payload.materi || entry.title || path.parse(entry.file).name)
  const subject = normalizeSubject({
    category: entry.category,
    level: payload.tingkat || entry.category,
    name: payload.mapel || title,
    description: payload.deskripsi || null,
  })
  const sections = arrayify(payload.konten).map((section, index) => ({
    order: index + 1,
    title: String(section.bab || section.title || `Bagian ${index + 1}`),
    body: String(section.teks || section.text || section.body || ''),
  }))

  return {
    subject,
    material: {
      sourceId: payload.id || entry.id || null,
      sourcePath: entry.path,
      category: entry.category,
      level: payload.tingkat || entry.category,
      slug: deriveMaterialSlug(entry, payload),
      title,
      summary: payload.deskripsi || null,
      description: payload.deskripsi || null,
      tags: uniqueStrings(arrayify(payload.tag)),
      sectionCount: sections.length,
      itemCount: Number(entry.itemCount || sections.length || 0),
      metadata: payload,
    },
    sections,
  }
}

function normalizeOptions(rawOptions) {
  return Object.entries(rawOptions || {}).map(([key, text], index) => ({
    key: String(key),
    text: String(text),
    order: index + 1,
  }))
}

function normalizePracticeSet(entry, payload) {
  const { soal, ...setMeta } = payload
  const title = String(payload.title || entry.title || payload.subKategori || payload.mapel || path.parse(entry.file).name)
  const subjectName = String(payload.subKategori || payload.mapel || title)
  const subject = normalizeSubject({
    category: entry.category,
    level: payload.tingkat || payload.kategori || entry.category,
    name: subjectName,
    description: payload.deskripsi || null,
  })
  const baseTags = uniqueStrings([...(arrayify(payload.tag)), entry.category, payload.tingkat, payload.kategori, subjectName])
  const questions = arrayify(payload.soal).map((question, index) => ({
    sourceQuestionId: question.id || null,
    order: index + 1,
    text: String(question.pertanyaan || question.teks || question.question || ''),
    answerKey: String(question.jawaban || question.kunci || question.answer || ''),
    explanation: question.pembahasan ? String(question.pembahasan) : null,
    tip: question.trik ? String(question.trik) : null,
    topic: question.topik ? String(question.topik) : subjectName,
    difficulty: question.tingkatKesulitan ? String(question.tingkatKesulitan) : question.tingkat ? String(question.tingkat) : null,
    level: payload.tingkat ? String(payload.tingkat) : payload.kategori ? String(payload.kategori) : entry.category,
    options: normalizeOptions(question.opsi),
    tags: uniqueStrings([...baseTags, question.topik, question.tingkatKesulitan]),
    metadata: question,
  }))

  return {
    subject,
    questionSet: {
      sourceKind: 'practice',
      sourceId: payload.id || entry.id || null,
      sourcePath: entry.path,
      category: entry.category,
      level: payload.tingkat || payload.kategori || entry.category,
      slug: deriveSetSlug(entry, payload, 'practice'),
      title,
      focus: payload.subKategori || payload.mapel || null,
      mode: payload.tipe || 'Latihan Soal',
      description: payload.deskripsi || `Bank soal ${subjectName}`,
      itemCount: questions.length,
      durationMinutes: null,
      tags: baseTags,
      metadata: setMeta,
    },
    questions,
  }
}

function normalizeTryoutSet(entry, payload) {
  const questionList = Array.isArray(payload) ? payload : arrayify(payload.soal)
  const setMeta = Array.isArray(payload) ? { source: entry.path, kind: 'array' } : (({ soal, ...rest }) => rest)(payload)
  const first = questionList[0] || {}
  const title = String((Array.isArray(payload) ? entry.title : payload.judul || entry.title) || path.parse(entry.file).name)
  const subjectName = String(entry.focus || payload.focus || first.mapel || first.topik || title)
  const subject = normalizeSubject({
    category: entry.category,
    level: first.jenjang || payload.tingkat || entry.category,
    name: subjectName,
    description: payload.deskripsi || null,
  })
  const baseTags = uniqueStrings([entry.category, entry.mode, entry.focus, first.jenjang, first.mapel, subjectName])
  const questions = questionList.map((question, index) => ({
    sourceQuestionId: question.id || null,
    order: index + 1,
    text: String(question.pertanyaan || question.teks || question.question || ''),
    answerKey: String(question.jawaban || question.kunci || question.answer || ''),
    explanation: question.pembahasan ? String(question.pembahasan) : null,
    tip: question.trik ? String(question.trik) : null,
    topic: question.topik ? String(question.topik) : question.mapel ? String(question.mapel) : subjectName,
    difficulty: question.tingkat ? String(question.tingkat) : question.tingkatKesulitan ? String(question.tingkatKesulitan) : null,
    level: question.jenjang ? String(question.jenjang) : payload.tingkat ? String(payload.tingkat) : entry.category,
    options: normalizeOptions(question.opsi),
    tags: uniqueStrings([...baseTags, question.topik, question.mapel, question.tingkat]),
    metadata: question,
  }))

  return {
    subject,
    questionSet: {
      sourceKind: 'tryout',
      sourceId: payload.id || entry.id || null,
      sourcePath: entry.path,
      category: entry.category,
      level: first.jenjang || payload.tingkat || entry.category,
      slug: deriveSetSlug(entry, payload, 'tryout'),
      title,
      focus: entry.focus || payload.focus || first.mapel || null,
      mode: entry.mode || payload.mode || 'tryout',
      description: payload.deskripsi || `Set tryout ${title}`,
      itemCount: questions.length,
      durationMinutes: Number(entry.duration || payload.durasiMenit || 0) || null,
      tags: baseTags,
      metadata: setMeta,
    },
    questions,
  }
}

async function importMaterials(pool) {
  const index = await readJson('materi_index.json')
  let imported = 0

  for (const entry of index.entries) {
    const payload = await readJson(entry.path)
    const normalized = normalizeMaterialEntry(entry, payload)
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()
      const subjectId = await ensureSubject(connection, normalized.subject)
      const materialId = await upsertMaterial(connection, {
        ...normalized.material,
        subjectId,
      })
      await replaceMaterialSections(connection, materialId, normalized.sections)
      await connection.commit()
      imported += 1
      console.log(`[materials] imported ${normalized.material.slug}`)
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  return imported
}

async function importQuestionSets(pool, indexFile, sourceKind) {
  const index = await readJson(indexFile)
  let importedSets = 0
  let importedQuestions = 0

  for (const entry of index.entries) {
    const payload = await readJson(entry.path)
    const normalized = sourceKind === 'practice' ? normalizePracticeSet(entry, payload) : normalizeTryoutSet(entry, payload)
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()
      const subjectId = await ensureSubject(connection, normalized.subject)
      const setId = await upsertQuestionSet(connection, {
        ...normalized.questionSet,
        subjectId,
      })
      await replaceSetQuestions(connection, setId, normalized.questions)
      await connection.commit()
      importedSets += 1
      importedQuestions += normalized.questions.length
      console.log(`[${sourceKind}] imported ${normalized.questionSet.slug} (${normalized.questions.length} questions)`)
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  return { importedSets, importedQuestions }
}

async function main() {
  await loadEnvFile('.env')
  await loadEnvFile('.env.local')

  const pool = buildPool()

  try {
    const materialCount = await importMaterials(pool)
    const practiceResult = await importQuestionSets(pool, 'soal_index.json', 'practice')
    const tryoutResult = await importQuestionSets(pool, 'tryout_matrix_index.json', 'tryout')

    console.log('')
    console.log('Content import completed successfully.')
    console.log(`- Materials: ${materialCount}`)
    console.log(`- Practice sets: ${practiceResult.importedSets}`)
    console.log(`- Practice questions: ${practiceResult.importedQuestions}`)
    console.log(`- Tryout sets: ${tryoutResult.importedSets}`)
    console.log(`- Tryout questions: ${tryoutResult.importedQuestions}`)
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Content import failed.')
  console.error(error)
  process.exitCode = 1
})
