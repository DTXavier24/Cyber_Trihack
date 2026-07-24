#ifndef JIT_VM_H
#define JIT_VM_H

#include <stddef.h>
#include <stdint.h>

typedef enum {
  OP_ADD = 0,
  OP_MOV,
  OP_SHL,
  OP_COPY,
  OP_LOAD,
  OP_LOAD8,
  OP_STORE,
  OP_STORE8,
  OP_CMP,
  OP_JNE,
  OP_EXIT,
} Opcode;

typedef struct {
  uint8_t opcode;
  uint8_t reg_dst;
  uint8_t reg_src;
  uint8_t scale;
  uint8_t imm;
  uint8_t padding[3];
} Instruction;

typedef struct {
  uint64_t registers[8];
  uint8_t memory[256];
  uint32_t mem_size;
  uint32_t padding;
  uint8_t *mem_ptr;
} VMState;

#endif
