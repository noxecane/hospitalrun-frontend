import AbstractModel from 'hospitalrun/models/abstract';
import CanEditRequested from 'hospitalrun/mixins/can-edit-requested';
import DateFormat from 'hospitalrun/mixins/date-format';
import DS from 'ember-data';
import Ember from 'ember';
import PatientValidation from 'hospitalrun/utils/patient-validation';
import ResultValidation from 'hospitalrun/mixins/result-validation';

const { computed, get } = Ember;

export default AbstractModel.extend(CanEditRequested, DateFormat, ResultValidation, {
  // Attributes
  labDate: DS.attr('date'),
  notes: DS.attr('string'),
  requestedBy: DS.attr('string'),
  requestedDate: DS.attr('date'),
  result: DS.attr('string'),
  status: DS.attr('string'),
  hasPayed: DS.attr('boolean', { defaultValue: false }),

  // Associations
  charges: DS.hasMany('proc-charge', { async: false }),
  labType: DS.belongsTo('pricing', { async: false }),
  patient: DS.belongsTo('patient', { async: false }),
  visit: DS.belongsTo('visit', { async: false }),

  labDateAsTime: computed('labDate', function() {
    return this.dateToTime(get(this, 'labDate'));
  }),

  requestedDateAsTime: computed('requestedDate', function() {
    return this.dateToTime(get(this, 'requestedDate'));
  }),

  // Heamatology
  haematology_hb: DS.attr('number'),
  haematology_pcv: DS.attr('number'),
  haematology_wbc: DS.attr('number'),
  haematology_neut: DS.attr('number'),
  haematology_lymph: DS.attr('number'),
  haematology_eosin: DS.attr('number'),
  haematology_mono: DS.attr('number'),
  haematology_bas: DS.attr('number'),
  haematology_esr: DS.attr('number'),
  haematology_platelets: DS.attr('number'),
  haematology_bleeding_time: DS.attr('number'),
  haematology_clothing_time: DS.attr('number'),

  // Chemistry
  chemistry_sodium: DS.attr('number'),
  chemistry_potassium: DS.attr('number'),
  chemistry_chlorine: DS.attr('number'),
  chemistry_bicarb: DS.attr('number'),
  chemistry_urea: DS.attr('number'),
  chemistry_uric_acid: DS.attr('number'),
  chemistry_creatine: DS.attr('number'),
  chemistry_calcium: DS.attr('number'),
  chemistry_posph: DS.attr('number'),
  chemistry_cholesterol: DS.attr('number'),
  chemistry_triglycerides: DS.attr('number'),
  chemistry_amylase: DS.attr('number'),
  chemistry_bilirubin_total: DS.attr('number'),
  chemistry_bilirubin_conj: DS.attr('number'),
  chemistry_bilirubin_unconj: DS.attr('number'),
  chemistry_serum_total_protein: DS.attr('number'),
  chemistry_serum_albumin: DS.attr('number'),
  chemistry_serum_globulin: DS.attr('number'),
  chemistry_ast_got: DS.attr('number'),
  chemistry_alt_gpt: DS.attr('number'),
  chemistry_alk_got: DS.attr('number'),
  chemistry_alk_phos: DS.attr('number'),
  chemistry_acid_phos: DS.attr('number'),
  chemistry_GT: DS.attr('number'),
  chemistry_LDL: DS.attr('number'),
  chemistry_LDH: DS.attr('number'),
  chemistry_HDL: DS.attr('number'),
  chemistry_CPK: DS.attr('number'),

  microbilogy_pus_cell: DS.attr('string'),
  microbilogy_red_blood_cell: DS.attr('string'),
  microbilogy_epithetial_cells: DS.attr('string'),
  microbilogy_casts: DS.attr('string'),
  microbilogy_crystal: DS.attr('string'),
  microbilogy_bacterial: DS.attr('string'),
  microbilogy_csf_appearance: DS.attr('string'),
  microbilogy_wbc: DS.attr('string'),
  microbilogy_diff: DS.attr('string'),
  microbilogy_csf_sugar: DS.attr('number'),
  microbilogy_csf_protein: DS.attr('number'),
  microbilogy_csf_chlor: DS.attr('number'),
  microbilogy_afb: DS.attr('string'),
  microbilogy_heaf: DS.attr('string'),
  microbilogy_sputum_appearance: DS.attr('string'),
  microbilogy_urethral: DS.attr('string'),
  microbilogy_vagina: DS.attr('string'),
  microbilogy_throat: DS.attr('string'),
  microbilogy_wound: DS.attr('string'),
  microbilogy_eye: DS.attr('string'),
  microbilogy_ear: DS.attr('string'),
  microbilogy_others: DS.attr('string'),

  sfa_time_collected: DS.attr('date'),
  sfa_time_recieved: DS.attr('date'),
  sfa_time_analysed: DS.attr('date'),
  sfa_volume: DS.attr('number'),
  sfa_consistency: DS.attr('number'),
  sfa_colour: DS.attr('number'),
  sfa_motility: DS.attr('number'),
  sfa_abnormality: DS.attr('number'),
  sfa_microscopy: DS.attr('number'),
  sfa_count: DS.attr('number'),
  sfa_comment: DS.attr('number'),
  sfa_ampicilin: DS.attr('number'),
  sfa_nalidixrantion: DS.attr('number'),
  sfa_comp_sulphonamine: DS.attr('number'),
  sfa_comp_streptomycin: DS.attr('number'),
  sfa_tetracycline: DS.attr('number'),
  sfa_septrine: DS.attr('number'),
  sfa_furtum: DS.attr('number'),
  sfa_zinnat: DS.attr('number'),
  sfa_carbenicillin: DS.attr('number'),
  sfa_chlorramphenicol: DS.attr('number'),
  sfa_erythromycin: DS.attr('number'),
  sfa_ceptraixone: DS.attr('number'),
  sfa_penicillin_ampicox: DS.attr('number'),
  sfa_ciproxin: DS.attr('number'),
  sfa_gentamycin: DS.attr('number'),
  sfa_amoxycillin: DS.attr('number'),

  validations: {
    labTypeName: {
      presence: {
        'if'(object) {
          if (object.get('isNew')) {
            return true;
          }
        },
        message: 'Please select a lab type'
      }
    },
    patientTypeAhead: PatientValidation.patientTypeAhead,
    patient: {
      presence: true
    }
  }
});
